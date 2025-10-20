import React, { useState, useEffect } from 'react';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newPath: string) => void;
    currentPath: string;
    t: (key: string, replacements?: any) => string;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSave, currentPath, t }) => {
    const [newPath, setNewPath] = useState(currentPath);

    useEffect(() => {
        setNewPath(currentPath);
    }, [currentPath]);

    const handleSave = () => {
        if (newPath.trim() && newPath !== currentPath) {
            onSave(newPath.trim());
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">{t('editCategory')}</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('categoryName')}
                    </label>
                    <input
                        type="text"
                        value={newPath}
                        onChange={(e) => setNewPath(e.target.value)}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder={t('categoryExample')}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSave} disabled={!newPath.trim() || newPath === currentPath} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700 disabled:hover:bg-blue-600">
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
};
