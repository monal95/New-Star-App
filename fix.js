
const fs = require('fs');
let c = fs.readFileSync('backend/routes/workAssignments.js', 'utf8');

const regex = /const assignedQuantity = [\s\S]*?(?=\s*\/\/ Create activity log)/s;

const replacement = \const assignedQuantity = parseInt(quantity) || 0;

      if (assignedQuantity <= 0) {
        return res.status(400).json({ error: 'Assigned quantity must be > 0' });
      }

      // Check current item rate
      const wages = await getRow('SELECT * FROM wages LIMIT 1');
      let itemRate = 0;
      if (wages) {
        if (task_type === 'Pant') itemRate = wages.pant || 110;
        else if (task_type === 'Shirt') itemRate = wages.shirt || 100;
        else if (task_type === 'Ironing') itemRate = Math.max(wages.ironing_pant || 12, wages.ironing_shirt || 10);
        else if (task_type === 'Embroidery') itemRate = 50;
      }
      
      const totalWage = assignedQuantity * itemRate;

      // Update order_items table strictly
      const item = await getRow(
        'SELECT * FROM order_items WHERE order_id = ? AND item_type = ?',
        [order.id, task_type]
      );
      if (item) {
        const trueRemaining = item.total_qty - item.assigned_qty;
        if (assignedQuantity > trueRemaining) {
          return res.status(400).json({ error: 'Exceeds remaining quantity', message: 'Exceeds remaining quantity' });
        }
        await runQuery(
          'UPDATE order_items SET assigned_qty = assigned_qty + ? WHERE id = ?',
          [assignedQuantity, item.id]
        );
      } else {
        // Validation for missing item, though fallback to old validation if it's legacy company
        const fieldName = orderType === 'company' ? 'employee_id' : 'order_id';
        let totalQty = order.noOfSets || 1;
        const assignmentResult = await getRow(\SELECT SUM(quantity) as totalAssigned FROM work_assignments WHERE \ = ? AND task_type = ?\, [order.id, task_type]);
        const alreadyAssigned = assignmentResult?.totalAssigned || 0;
        const remainingQty = Math.max(0, totalQty - alreadyAssigned);
        
        if (assignedQuantity > remainingQty) {
          return res.status(400).json({ error: 'Exceeds remaining quantity' });
        }
      }

      const insertQuery = orderType === 'company'
        ? 'INSERT INTO work_assignments (labour_id, employee_id, task_type, quantity, status, total_wage) VALUES (?, ?, ?, ?, ?, ?)'
        : 'INSERT INTO work_assignments (labour_id, order_id, task_type, quantity, status, total_wage) VALUES (?, ?, ?, ?, ?, ?)';

      const insertResult = await runQuery(insertQuery, [
        labourId,
        order.id,
        task_type,
        assignedQuantity,
        'Pending',
        totalWage,
      ]);\;

c = c.replace(regex, replacement);
fs.writeFileSync('backend/routes/workAssignments.js', c);
