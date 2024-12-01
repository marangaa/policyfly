import { prisma } from '@/lib/prisma';
import { DocumentGenerationForm } from './document-generation-form';
import { Template } from '@prisma/client';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function NewDocumentPage({ searchParams }: PageProps) {
  // Get all templates ordered by name
  const templates = await prisma.template.findMany({
    orderBy: { name: 'asc' }
  });

  let initialTemplate: Template | null = null;
  const templateId = typeof searchParams?.template === 'string' ? searchParams.template : undefined;

  if (templateId) {
    initialTemplate = await prisma.template.findUnique({
      where: { id: templateId }
    });
  }

  return (
    <main>
      <DocumentGenerationForm 
        templates={templates} 
        initialTemplate={initialTemplate}
      />
    </main>
  );
}
