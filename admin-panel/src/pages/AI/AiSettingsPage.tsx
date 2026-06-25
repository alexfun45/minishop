import React, { useState, useEffect } from 'react';
import { Sliders, FileText, Sparkles, Save, Percent, HelpCircle, Upload, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { apiClient } from '../../services/api';

interface AiSettings {
  system_prompt: string;
  creativity_level: number; // Это наша "температура"
  company_promotions: string;
}

interface DocumentFile {
  id: string;
  file_name: string;
  file_size: string;
}

export const AiSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AiSettings>({
    system_prompt: '',
    creativity_level: 0.3,
    company_promotions: ''
  });
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
      isOpen: boolean;
      docId: string | null;
      docName: string;
    }>({
      isOpen: false,
      docId: null,
      docName: '',
    });

  useEffect(() => {
    // Здесь будет загрузка текущих настроек с бэкенда
    apiClient.get('/ai/ai-settings').then((res) => {
      const __settings = res.data.settings;
      const updatedSetting = {...settings, ...__settings};
      setSettings(updatedSetting);
      setDocuments(res.data.docs);
    })
    
    // Фейковые данные для демонстрации документов базы знаний
    //setDocuments([
    //  { id: '1', name: 'Правила_возврата_и_доставки.pdf', size: '1.2 MB' },
    //  { id: '2', name: 'Размерная_сетка_обуви_и_одежды.docx', size: '450 KB' },
    //]);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
       await apiClient.post('/ai/save-ai-settings', settings);
      alert('Настройки ассистента успешно сохранены!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
  
    const file = files[0];
    
    const formData = new FormData();
    formData.append('file', file);
  
    const temporaryId = Math.random().toString();
    const newDoc = {
      id: temporaryId,
      file_name: file.name,
      file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      status: 'processing' as const
    };
    console.log('newDoc', newDoc);
    setDocuments(prev => [...prev, newDoc]);
  
    try {
      // Отправляем запрос на бэкенд
      console.log('отправляю файл на сервер');
      await apiClient.post('/ai/documents', formData);
  
      // Заменяем временный документ реальным ответом от базы данных
      //setDocuments(prev => 
      //  prev.map(doc => doc.id === temporaryId ? { ...response.data, name: response.data.file_name, size: response.data.file_size } : doc)
      //);
  
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      alert('Не удалось загрузить файл');
      // Удаляем файл из списка, если загрузка оборвалась
      setDocuments(prev => prev.filter(doc => doc.id !== temporaryId));
    }
  };

  const initiateDelete = (id: string, fileName: string) => {
    setDeleteDialog({
      isOpen: true,
      docId: id,
      docName: fileName,
    });
  };

  // 2. Срабатывает, когда пользователь нажал «Удалить» в красивом модальном окне
  const handleConfirmDelete = async () => {
    const { docId } = deleteDialog;
    if (!docId) return;

    // Сразу закрываем окно, чтобы UI реагировал мгновенно
    setDeleteDialog(prev => ({ ...prev, isOpen: false }));

    try {
      apiClient.get(`/ai/documents/${docId}`);
      // Обновляем список документов в стейте
      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    } catch (error) {
      console.error('Не удалось удалить документ:', error);
      alert('Произошла ошибка при удалении документа с сервера.');
    }
  };

  const handleDeleteDoc = async (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    await apiClient.post('/ai/delete_document', {docId: id});
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 space-y-6 transition-colors duration-200">
      
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight flex items-center gap-3">
            <span>🤖</span> Настройки ИИ-ассистента
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Управление характером, знаниями и поведением вашего умного помощника на сайте.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold px-6 py-3 rounded-xl shadow-sm transition duration-150 text-sm whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ЛЕВАЯ КОЛОНКА: Инструкции и характер (Занимает 2 части) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Блок 1: Системный промпт */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-lg">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h2>Главная инструкция (Промпт)</h2>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Опишите роль ИИ, его тон общения и ограничения. Например: «Ты — вежливый менеджер магазина спортивных товаров. Помогай подбирать размеры и предлагай сопутствующие товары.»
            </p>
            <textarea
              rows={8}
              value={settings.system_prompt}
              onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
              placeholder="Введите общие правила поведения для робота..."
              className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm font-medium"
            />
          </div>

          {/* Блок 2: Действующие акции компании */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-lg">
              <Percent className="w-5 h-5 text-emerald-500" />
              <h2>Действующие акции и спецпредложения</h2>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              ИИ будет автоматически предлагать эти офферы клиентам в диалоге, когда это уместно (например, при оформлении корзины).
            </p>
            <textarea
              rows={4}
              value={settings.company_promotions}
              onChange={(e) => setSettings({ ...settings, company_promotions: e.target.value })}
              placeholder="Например: До конца недели скидка 10% на все кроссовки по промокоду RUN10. При заказе от 5000 рублей — доставка бесплатная."
              className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm font-medium"
            />
          </div>

        </div>

        {/* ПРАВАЯ КОЛОНКА: Настройки гибкости и База документов */}
        <div className="space-y-6">
          
          {/* Блок 3: Температура (Уровень строгости/креативности) */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-lg">
                <Sliders className="w-5 h-5 text-amber-500" />
                <h2>Характер ответов</h2>
              </div>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute right-0 bottom-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg z-10 font-normal">
                  Влияет на параметр Температуры (Temperature) в нейросети. Чем ниже, тем ответы точнее и строже по инструкции.
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <span>Строгий / Точный</span>
                <span className="text-indigo-500 dark:text-indigo-400">
                  {settings.creativity_level < 0.4 ? 'Точные факты' : settings.creativity_level > 0.7 ? 'Творческий' : 'Сбалансированный'}
                </span>
                <span>Импровизация</span>
              </div>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.creativity_level}
                onChange={(e) => setSettings({ ...settings, creativity_level: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
              />
              
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed pt-1">
                Для консультанта интернет-магазина рекомендуется выставлять **строгий** или **сбалансированный** режим, чтобы робот не выдумывал несуществующие условия доставки.
              </p>
            </div>
          </div>

          {/* Блок 4: Загрузка документов (База знаний / RAG) */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold text-lg">
              <FileText className="w-5 h-5 text-blue-500" />
              <h2>База знаний (PDF, DOCX)</h2>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Загрузите файлы с регламентами, сетками размеров или условиями возврата. ИИ будет использовать их как первоисточник знаний.
            </p>

            {/* Зона загрузки */}
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition group">
              <input
                type="file"
                className="hidden"
                id="file-upload"
                accept=".pdf"
                onChange={handleFileUpload} 
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 transition" />
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Загрузить файлы</span>
                <span className="text-[10px] text-gray-400">PDF, DOCX до 10MB</span>
              </label>
            </div>

            {/* Список загруженных файлов */}
            <div className="space-y-2 pt-2">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-gray-700 dark:text-gray-300 truncate text-xs">{doc.file_name}</p>
                      <p className="text-[10px] text-gray-400">{doc.file_size}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => initiateDelete(doc.id, doc.file_name)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Удалить документ?"
        description={`Вы собираетесь полностью удалить файл "${deleteDialog.docName}".\nИИ потеряет доступ к этим данным, а связанные векторы в LanceDB будут безвозвратно стерты.`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
        isDanger={true}
      />
    </div>
  );
};