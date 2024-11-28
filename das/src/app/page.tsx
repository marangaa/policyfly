import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const stats = await prisma.$transaction([
    prisma.template.count(),
    prisma.document.count(),
    prisma.template.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { documents: { select: { id: true } } }
    })
  ])

  const [totalTemplates, totalDocuments, recentTemplates] = stats

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Main Actions */}
      <div className="px-4 py-6 sm:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Template Card */}
          <Link
            href="/templates/upload"
            className="relative group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="px-6 py-8">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Upload Template</h3>
              <p className="mt-2 text-sm text-gray-500">
                Upload a new document template with variables to automate your document generation process.
              </p>
              <div className="absolute bottom-4 right-6 text-blue-600 group-hover:translate-x-1 transition-transform duration-300">
                →
              </div>
            </div>
          </Link>

          {/* Generate Document Card */}
          <Link
            href="/documents/new"
            className="relative group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="px-6 py-8">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Generate Document</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create a new document by filling in the variables for your selected template.
              </p>
              <div className="absolute bottom-4 right-6 text-green-600 group-hover:translate-x-1 transition-transform duration-300">
                →
              </div>
            </div>
          </Link>
        </div>

        {/* Statistics Section */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Templates */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Templates</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalTemplates}</dd>
              </div>
            </div>

            {/* Total Documents */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Generated Documents</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalDocuments}</dd>
              </div>
            </div>

            {/* Most Used Template */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Most Active Template</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {recentTemplates[0]?.documents.length || 0}
                  <span className="text-sm text-gray-500 ml-1">uses</span>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Templates */}
        {recentTemplates.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Templates</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {recentTemplates.map((template) => (
                  <li key={template.id}>
                    <Link href={`/templates/${template.id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">{template.name}</p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {template.documents.length} documents
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {template.category}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              Created on {new Date(template.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}