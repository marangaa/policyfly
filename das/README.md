# 🚀 Document Automation System (DAS) - Your Document Workflow Supercharger

<div align="center" style="background-color: #f0f7ff; padding: 20px; border-radius: 10px;">
  <h2>💫 Turn Templates into Dynamic Documents</h2>
</div>

## 🌟 Introduction

Welcome to the Document Automation System (DAS)! This powerful Next.js application transforms the way you handle document workflows, making template management and document generation a breeze. Whether you're dealing with insurance policies, contracts, or any standardized documents, DAS streamlines your process from template to final document.

## 🎯 Key Features

### 📝 Template Management
- **Smart Variable Detection**: Automatically identifies template variables in your documents (e.g., {{customerName}}, {{policyNumber}})
- **Template Organization**: Categorize and manage templates efficiently
- **Universal Compatibility**: Works with any .docx template that uses the {{variableName}} syntax

### 🔄 Document Generation
- **Dynamic Form Generation**: Automatically creates input forms based on detected variables

- **Instant Download**: Get your generated documents immediately
- **Version Control**: Keep track of all generated documents

## 🛠️ Technical Stack

- **Frontend**: Next.js 13/14 with App Router
- **UI**: TailwindCSS for beautiful, responsive designs
- **Database**: PostgreSQL with Prisma ORM
- **Document Processing**: Docxtemplater & PizZip
- **File Handling**: Custom fs API for browser environment

## 🚀 Getting Started

### Prerequisites
```bash
# Make sure you have Node.js and npm installed
node -v
npm -v
```

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env

# Update .env with your database connection string
DATABASE_URL="postgresql://username:password@localhost:5432/docautomation"

# Run database migrations
npx prisma generate
npx prisma db push

# Create necessary directories
mkdir -p uploads/templates uploads/documents

# Start the development server
npm run dev
```

## 📂 Project Structure

```
doc-automation/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── documents/         # Document generation pages
│   └── templates/         # Template management pages
├── lib/                   # Utility functions and shared code
├── prisma/               # Database schema and migrations
└── uploads/              # File storage
    ├── templates/        # Uploaded templates
    └── documents/        # Generated documents
```

## 🎨 Usage Guide

### 1️⃣ Template Upload
Upload any Word document (.docx) that contains variables in the format {{variableName}}. For example:
```
Dear {{customerName}},
Your policy number {{policyNumber}} is due for renewal...
```

### 2️⃣ Document Generation
1. Select a template from your library
2. Fill in the automatically generated form fields
3. Generate and download your document

## 🔍 Advanced Features

### Template Variables
Variables can include:
- Simple replacements: {{name}}
- Conditional sections: {{#if hasInsurance}}...{{/if}}
- Lists and loops: {{#each items}}...{{/each}}

### Document Categories
Organize templates by:
- Insurance Policies
- Claims Forms
- Renewal Notices
- Customer Communications

## 🛠️ Troubleshooting

### Variable Detection Issues
If variables aren't being detected:
1. Ensure variables use double curly braces {{like_this}}
2. Avoid special formatting around variables
3. Use plain text when typing variables
4. Save documents in .docx format

### Common Error Solutions
- **File System Errors**: Ensure uploads directories exist
- **Database Connections**: Verify DATABASE_URL in .env
- **Template Processing**: Check template format and variable syntax

## 🌟 Best Practices

1. **Template Design**
   - Use clear, consistent variable naming
   - Keep formatting simple around variables
   - Test templates with sample data

2. **Document Generation**
   - Review generated documents before sending
   - Maintain a backup of important templates
   - Use meaningful names for generated documents

## 🤝 Contributing

We welcome contributions! Feel free to:
- Report bugs
- Suggest improvements
- Submit pull requests

## 📞 Support

Need help? Here's how to get support:
- Check the troubleshooting guide 🥲 doesnt exist 
- Open an issue
- Contact me 👀
- send PR

## 🎉 Future Enhancements

We're planning to add:
- **Real-time Preview**: See your document take shape as you fill in the details
- 📊 Analytics dashboard
- 🔄 Batch processing
- 📱 Mobile app integration
- 🔐 Advanced access controls

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center" style="background-color: #f0fff4; padding: 20px; border-radius: 10px; margin-top: 20px;">
  <p>Built with ❤️ by me</p>
  <p>Making document workflows smarter, one template at a time 🚀</p>
</div>
