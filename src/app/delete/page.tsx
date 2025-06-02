'use client'
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useFoundryAuth } from '@/hooks/useFoundryAuth';
import { deletePublicationFromPalantir } from '@/components/palantir/palantirPublications';

const DeletePublicationsPage: React.FC = () => {
  const auth = useFoundryAuth();
  const [publicationId, setPublicationId] = useState('');
  const [bulkIds, setBulkIds] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleSingleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicationId.trim() || !auth.accessToken) return;

    setIsDeleting(true);
    try {
      const id = parseInt(publicationId.trim());
      if (isNaN(id)) {
        throw new Error('Please enter a valid numeric ID');
      }

      await deletePublicationFromPalantir(id, auth.accessToken);
      showMessage(`Successfully deleted publication ${id}`, 'success');
      setPublicationId('');
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : 'Failed to delete publication',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkIds.trim() || !auth.accessToken) return;

    setIsDeleting(true);
    try {
      // Parse IDs from comma-separated or newline-separated input
      const ids = bulkIds
        .split(/[,\n]/)
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

      if (ids.length === 0) {
        throw new Error('Please enter valid numeric IDs');
      }

      let successCount = 0;
      let errorCount = 0;

      for (const id of ids) {
        try {
          await deletePublicationFromPalantir(id, auth.accessToken);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to delete ${id}:`, error);
        }
        // Small delay between deletions
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      showMessage(
        `Deleted ${successCount} publications successfully. ${errorCount} failed.`,
        errorCount === 0 ? 'success' : 'error'
      );
      setBulkIds('');
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : 'Failed to delete publications',
        'error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!auth.accessToken) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Please log in to access the delete publications feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Delete Publications</h1>

      {message && (
        <div className={`p-4 rounded mb-4 ${
          messageType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Single Delete */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Delete Single Publication</h2>
        <form onSubmit={handleSingleDelete}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publication ID
            </label>
            <input
              type="text"
              value={publicationId}
              onChange={(e) => setPublicationId(e.target.value)}
              placeholder="Enter publication ID (e.g., 12345)"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={isDeleting}
            />
          </div>
          <button
            type="submit"
            disabled={isDeleting || !publicationId.trim()}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete Publication'}
          </button>
        </form>
      </div>

      {/* Bulk Delete */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Delete Multiple Publications</h2>
        <form onSubmit={handleBulkDelete}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Publication IDs (comma or newline separated)
            </label>
            <textarea
              value={bulkIds}
              onChange={(e) => setBulkIds(e.target.value)}
              placeholder="Enter multiple IDs separated by commas or new lines:&#10;12345, 67890&#10;11111&#10;22222"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={isDeleting}
            />
          </div>
          <button
            type="submit"
            disabled={isDeleting || !bulkIds.trim()}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete Publications'}
          </button>
        </form>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Warning:</strong> This action permanently deletes publications from your database and cannot be undone.
        </p>
      </div>
    </div>
  );
};

export default DeletePublicationsPage;