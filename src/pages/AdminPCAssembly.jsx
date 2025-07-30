import React from 'react';
import PCAssembly from './PCAssembly.jsx';

// This component wraps the client PCAssembly and will be customized for Admin
const AdminPCAssembly = (props) => {
  // You can add Admin-specific logic, props, or UI customizations here
  // For now, render the client PCAssembly
  return (
    <div>
      <PCAssembly {...props} />
    </div>
  );
};

export default AdminPCAssembly; 