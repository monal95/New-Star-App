
const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/CompanyDashboard.jsx', 'utf8');

const regex = /const handleSubmitAssignment = async \(e\) => \{[\s\S]*?!assignmentData\.quantity[\s\S]*?return;\n      \}/;

const replacement = \const handleSubmitAssignment = async (e) => {
      e.preventDefault();

      if (
        !assignmentData.labourId ||
        !assignmentData.workType ||
        !assignmentData.quantity
      ) {
        setToast({
          show: true,
          message: 'Please fill all required fields',
          type: 'error',
        });
        return;
      }

      const assignedQuantity = parseInt(assignmentData.quantity) || 0;
      if (assignedQuantity <= 0) {
        setToast({
          show: true,
          message: 'Assigned quantity must be greater than 0',
          type: 'error',
        });
        return;
      }\;

c = c.replace(regex, replacement);
fs.writeFileSync('frontend/src/components/CompanyDashboard.jsx', c);
