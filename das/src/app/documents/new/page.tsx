import { DocumentGenerationForm } from './document-generation-form'
import { prisma } from '@/lib/prisma'

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: { template?: string }
}) {
  // Fetch all templates
  const templates = await prisma.template.findMany({
    orderBy: { name: 'asc' }
  });

  // Get initial template if specified in URL
  const initialTemplate = searchParams.template ? 
    templates.find(t => t.id === searchParams.template) || null : 
    null;

  return (
    <DocumentGenerationForm 
      templates={templates} 
      initialTemplate={initialTemplate} 
    />
  );
}
