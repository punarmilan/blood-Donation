import fs from 'fs';

let content = fs.readFileSync('Frontend/src/pages/Admin.jsx', 'utf8');

// Add import if not exists
if (!content.includes('import toast from "react-hot-toast";')) {
  content = content.replace(
    'import { useNavigate } from "react-router-dom";',
    'import { useNavigate } from "react-router-dom";\nimport toast from "react-hot-toast";'
  );
}

// Replace alerts
content = content.replace(/alert\("✅ (.*?)"\)/g, 'toast.success("$1")');
content = content.replace(/alert\('✅ (.*?)'\)/g, "toast.success('$1')");
content = content.replace(/alert\(`✅ (.*?)`\)/g, 'toast.success(`$1`)');
content = content.replace(/alert\("🎉 (.*?)"\)/g, 'toast.success("$1")');

content = content.replace(/alert\((.*?"Error.*?")\)/gi, 'toast.error($1)');
content = content.replace(/alert\((.*?"Failed.*?")\)/gi, 'toast.error($1)');
content = content.replace(/alert\((.*?"fail.*?")\)/gi, 'toast.error($1)');

content = content.replace(/alert\(err\?.response\?.data\?.message \|\| (.*?)\)/g, 'toast.error(err?.response?.data?.message || $1)');

content = content.replace(/return alert\("Please enter rejection reason"\)/g, 'return toast.error("Please enter rejection reason")');
content = content.replace(/alert\("Please enter new password"\)/g, 'toast.error("Please enter new password")');
content = content.replace(/return alert\("No donors to export."\)/g, 'return toast.error("No donors to export.")');

content = content.replace(/alert\("Status updated!"\)/g, 'toast.success("Status updated!")');
content = content.replace(/alert\("Camp added successfully!"\)/g, 'toast.success("Camp added successfully!")');
content = content.replace(/alert\("Donor deleted successfully!"\)/g, 'toast.success("Donor deleted successfully!")');

fs.writeFileSync('Frontend/src/pages/Admin.jsx', content);
console.log('Replaced alerts with toasts');
