import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Plus,
  Search,
  BookOpen,
  Edit2,
  Trash2,
  Eye,
  Clock,
  Sparkles,
  Award,
  Coffee,
  CheckCircle,
  X,
  ExternalLink,
  ChevronLeft,
  FileText,
  UploadCloud,
  Download,
  Paperclip
} from 'lucide-react';
import { convertFileToBase64, formatFileSize, downloadPdfFile } from '../utils/pdfStorage';
import { PdfReaderModal } from '../components/PdfReaderModal';

export const AcademyAdminView = () => {
  const {
    academyArticles,
    addAcademyArticle,
    updateAcademyArticle,
    deleteAcademyArticle,
    setViewMode
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [activePdfForReader, setActivePdfForReader] = useState(null);
  const [externalPdfUrl, setExternalPdfUrl] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    category: 'brewing',
    categoryLabel: 'طرق التحضير',
    level: 'جميع المستويات',
    readTime: '4 دقائق',
    image: '/v60_set.jpg',
    author: 'أكاديمية كاتورا',
    summary: '',
    content: '',
    featured: false,
    pdfFile: null
  });

  // Filter articles
  const filteredArticles = (academyArticles || []).filter(art => {
    const matchesCat = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (art.summary && art.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (art.content && art.content.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Handle PDF file upload from local machine
  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('يرجى اختيار ملف بصيغة PDF فقط.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى الموصى به هو 25 ميجابايت.');
      return;
    }

    try {
      setIsUploadingPdf(true);
      const base64Data = await convertFileToBase64(file);
      const newPdf = {
        id: `pdf-${Date.now()}`,
        name: file.name,
        size: formatFileSize(file.size),
        sizeBytes: file.size,
        data: base64Data,
        uploadedAt: new Date().toISOString()
      };
      setFormData(prev => ({
        ...prev,
        pdfFile: newPdf
      }));
    } catch (err) {
      console.error('Error reading PDF file:', err);
      alert('حدث خطأ أثناء قراءة ملف الـ PDF. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingArticle(null);
    setExternalPdfUrl('');
    setFormData({
      title: '',
      titleEn: '',
      category: 'brewing',
      categoryLabel: 'طرق التحضير',
      level: 'جميع المستويات',
      readTime: '4 دقائق',
      image: '/v60_set.jpg',
      author: 'كابتن باريستا كاتورا',
      summary: '',
      content: `### الأدوات المطلوبة:\n- 18 جرام بن مختص طازج\n- 300 مل ماء نقي بدرجة حرارة 92°C\n\n### خطوات التحضير:\n1. خطوة الترطيب الأولي لمده 30 ثانية\n2. الصب التدريجي مع مراقبة التدفق\n3. الاستمتاع بالنكهات والإيحاءات الطبيعية`,
      featured: true,
      pdfFile: null
    });
    setIsAddEditModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (art) => {
    setEditingArticle(art);
    setExternalPdfUrl('');
    setFormData({
      title: art.title || '',
      titleEn: art.titleEn || '',
      category: art.category || 'brewing',
      categoryLabel: art.categoryLabel || 'طرق التحضير',
      level: art.level || 'جميع المستويات',
      readTime: art.readTime || '4 دقائق',
      image: art.image || '/v60_set.jpg',
      author: art.author || 'أكاديمية كاتورا',
      summary: art.summary || '',
      content: art.content || '',
      featured: Boolean(art.featured),
      pdfFile: art.pdfFile || null
    });
    setIsAddEditModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.summary) {
      alert('يرجى ملء عنوان المقال والملخص');
      return;
    }

    // Set category label automatically
    const categoryLabels = {
      brewing: 'طرق التحضير',
      grinding: 'طحن ومعايرة',
      origins: 'المحاصيل والمعالجة',
      barista: 'مهارات الباريستا'
    };
    const payload = {
      ...formData,
      categoryLabel: categoryLabels[formData.category] || 'إرشادات عامة'
    };

    if (editingArticle) {
      updateAcademyArticle(editingArticle.id, payload);
      alert('تم تحديث الدرس التعليمي بنجاح!');
    } else {
      addAcademyArticle(payload);
      alert('تم نشر الدرس التعليمي الجديد في المتجر بنجاح! 🎓');
    }

    setIsAddEditModalOpen(false);
  };

  // Delete article
  const handleDelete = (id, title) => {
    if (window.confirm(`هل أنت متأكد من حذف الدرس: "${title}" من الأكاديمية؟`)) {
      deleteAcademyArticle(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34, 203, 124, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mint-700)' }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                أكاديمية كاتورا للقهوة المختصة
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                إدارة المحتوى التعليمي، أدلة الاستخلاص، ودروس الباريستا المعروضة لعملاء المتجر.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="/"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault();
                setViewMode('client');
              }
            }}
            className="btn btn-outline"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="معاينة محتوى الأكاديمية كما يظهر للعملاء في المتجر"
          >
            <Eye size={16} />
            <span>معاينة في المتجر</span>
          </a>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: '800' }}
          >
            <Plus size={18} />
            <span>إضافة درس تعليمي جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--mint-100)', color: 'var(--mint-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>إجمالي الدروس والمقالات</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)' }}>{academyArticles?.length || 0}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>دروس مميزة بالواجهة</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)' }}>
              {academyArticles?.filter(a => a.featured).length || 0}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>أقسام التعلم النشطة</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-main)' }}>4 تخصصات</div>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* Categories */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'كافة المقالات' },
            { id: 'brewing', label: 'طرق التحضير (V60 & Filter)' },
            { id: 'grinding', label: 'درجات الطحن والمعايرة' },
            { id: 'origins', label: 'المحاصيل والمعالجة' },
            { id: 'barista', label: 'مهارات الباريستا والتبخير' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`btn ${selectedCategory === c.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '20px', padding: '5px 14px', fontSize: '0.82rem' }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="بحث في الدروس والمقالات..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingRight: '36px', height: '38px', fontSize: '0.85rem' }}
          />
          <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

      </div>

      {/* Articles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {filteredArticles.map(art => (
          <div
            key={art.id}
            className="card"
            style={{
              padding: '0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              border: art.featured ? '2px solid var(--mint-400)' : '1px solid var(--border-light)'
            }}
          >
            {/* Image Header */}
            <div style={{ position: 'relative', height: '180px', width: '100%', background: '#e2e8f0' }}>
              <img
                src={art.image || '/v60_set.jpg'}
                alt={art.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              
              {/* Category Pill */}
              <span style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(2, 44, 25, 0.88)',
                color: '#86efac',
                backdropFilter: 'blur(4px)',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.74rem',
                fontWeight: '800'
              }}>
                {art.categoryLabel || art.category}
              </span>

              {/* PDF Badge if attached */}
              {art.pdfFile && (
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(220, 38, 38, 0.92)',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <FileText size={13} />
                  <span>كتيب PDF</span>
                </span>
              )}

              {/* Read Time & Level */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                display: 'flex',
                gap: '6px'
              }}>
                <span style={{
                  background: 'rgba(0,0,0,0.7)',
                  color: '#ffffff',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Clock size={12} />
                  <span>{art.readTime || '4 دقائق'}</span>
                </span>

                <span style={{
                  background: 'rgba(34, 197, 94, 0.85)',
                  color: '#012012',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: '800'
                }}>
                  {art.level || 'مبتدئ'}
                </span>
              </div>
            </div>

            {/* Content Body */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', margin: 0, lineHeight: '1.4' }}>
                {art.title}
              </h3>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {art.summary}
              </p>

              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>✍️ {art.author || 'كاتورا'}</span>
                <span>📅 {art.date}</span>
              </div>

              {/* Actions Toolbar */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => setPreviewArticle(art)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '7px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Eye size={14} />
                  <span>معاينة</span>
                </button>

                {art.pdfFile && (
                  <button
                    type="button"
                    onClick={() => setActivePdfForReader({ pdf: art.pdfFile, title: art.title })}
                    className="btn btn-outline"
                    style={{ padding: '7px 11px', color: '#dc2626', borderColor: '#fca5a5' }}
                    title="فتح وقراءة ملف الـ PDF المرفق"
                  >
                    <FileText size={15} />
                  </button>
                )}

                <button
                  onClick={() => handleOpenEdit(art)}
                  className="btn btn-outline"
                  style={{ padding: '7px 12px', color: 'var(--mint-700)', borderColor: 'var(--mint-300)' }}
                  title="تعديل الدرس"
                >
                  <Edit2 size={15} />
                </button>

                <button
                  onClick={() => handleDelete(art.id, art.title)}
                  className="btn btn-outline"
                  style={{ padding: '7px 12px', color: '#dc2626', borderColor: '#fca5a5' }}
                  title="حذف الدرس"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <GraduationCap size={44} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 6px' }}>لا توجد دروس أو مقالات تطابق البحث</h3>
          <p style={{ fontSize: '0.85rem' }}>يمكنك إضافة درس جديد بالضغط على الزر أعلاه.</p>
        </div>
      )}

      {/* 📝 ADD / EDIT ARTICLE MODAL 📝 */}
      {isAddEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddEditModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--mint-950)', margin: 0 }}>
                {editingArticle ? 'تعديل الدرس التعليمي' : 'إضافة درس تعليمي جديد للأكاديمية 🎓'}
              </h2>
              <button onClick={() => setIsAddEditModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Title */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">عنوان الدرس التعليمي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دليل تحضير قهوة V60 باحترافية"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Category & Level */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">القسم / التخصص *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="brewing">طرق التحضير (V60, Chemex, Aeropress)</option>
                    <option value="grinding">درجات الطحن والمعايرة</option>
                    <option value="origins">المحاصيل وسلالات البن والمعالجة</option>
                    <option value="barista">فنون الباريستا وتبخير الحليب</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">مستوى الصعوبة</label>
                  <select
                    value={formData.level}
                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                    className="form-select"
                  >
                    <option value="جميع المستويات">جميع المستويات</option>
                    <option value="مبتدئ">مبتدئ (Beginner)</option>
                    <option value="متوسط">متوسط (Intermediate)</option>
                    <option value="محترف / متقدم">محترف / متقدم (Advanced)</option>
                  </select>
                </div>
              </div>

              {/* Read Time & Author */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">الوقت المقدر للقراءة والتطبيق</label>
                  <input
                    type="text"
                    placeholder="مثال: 4 دقائق"
                    value={formData.readTime}
                    onChange={e => setFormData({ ...formData, readTime: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">الكاتب / الباريستا</label>
                  <input
                    type="text"
                    placeholder="مثال: كابتن باريستا كاتورا"
                    value={formData.author}
                    onChange={e => setFormData({ ...formData, author: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Image URL & Presets */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">صورة الدرس التعليمي</label>
                <input
                  type="text"
                  placeholder="/v60_set.jpg"
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  className="form-input"
                />
                
                {/* Image Quick Presets */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>صور جاهزة:</span>
                  {[
                    { label: 'أدوات V60', path: '/v60_set.jpg' },
                    { label: 'بن إثيوبيا', path: '/caturra_ethiopia.jpg' },
                    { label: 'بن إسبريسو', path: '/caturra_espresso.jpg' },
                    { label: 'لوجو كاتورا', path: '/caturra_logo.jpg' }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: p.path })}
                      style={{
                        background: formData.image === p.path ? 'var(--mint-100)' : '#f1f5f9',
                        border: '1px solid var(--border-light)',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">ملخص سريع يظهر في الكارت (Teaser) *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="مقدمة سريعة تشرح فكرة الدرس لجذب العميل للقراءة..."
                  value={formData.summary}
                  onChange={e => setFormData({ ...formData, summary: e.target.value })}
                  className="form-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Content Body */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">المحتوى الكامل والخطوات العملية *</label>
                <textarea
                  required
                  rows={8}
                  placeholder="اكتب تفاصيل الدرس، المقادير، النسب (Ratio)، وخطوات التحضير بالتفصيل..."
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="form-input"
                  style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
                />
              </div>

              {/* 📄 PDF ATTACHMENT SECTION (رفع وإرفاق ملف PDF للدرس) 📄 */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#1e293b' }}>
                    <FileText size={18} style={{ color: '#dc2626' }} />
                    <span>ملف PDF مرفق للدرس (كتيب إرشادي / دليل عملي)</span>
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>اختياري (Optional)</span>
                </div>

                {formData.pdfFile ? (
                  /* Attached PDF Preview Card */
                  <div style={{
                    background: '#ffffff',
                    border: '1.5px solid #fecdd3',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(220, 38, 38, 0.12)',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileText size={22} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', wordBreak: 'break-all' }}>
                          {formData.pdfFile.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                          الحجم: <strong style={{ color: '#dc2626' }}>{formData.pdfFile.size || 'ملف رقمي'}</strong>
                          {formData.pdfFile.url ? ' • (رابط سحابي مباشر)' : ' • (ملف مرفوع)'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setActivePdfForReader({ pdf: formData.pdfFile, title: formData.title || formData.pdfFile.name })}
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Eye size={14} />
                        <span>معاينة الـ PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadPdfFile(formData.pdfFile)}
                        className="btn btn-outline"
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        title="تحميل الملف"
                      >
                        <Download size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, pdfFile: null })}
                        className="btn btn-outline"
                        style={{ padding: '6px 10px', color: '#dc2626', borderColor: '#fca5a5' }}
                        title="إزالة ملف الـ PDF"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Upload Dropzone & External Link */
                  <div>
                    <div
                      style={{
                        border: '2px dashed #cbd5e1',
                        borderRadius: '10px',
                        padding: '20px 16px',
                        textAlign: 'center',
                        background: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '10px'
                      }}
                      onClick={() => document.getElementById('academy-admin-pdf-input')?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--mint-600)'; e.currentTarget.style.background = '#f0fdf4'; }}
                      onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#ffffff'; }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.background = '#ffffff';
                        const file = e.dataTransfer.files?.[0];
                        if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
                          await handlePdfUpload(file);
                        } else {
                          alert('يرجى سحب وإفلات ملف بصيغة PDF فقط (.pdf)');
                        }
                      }}
                    >
                      <input
                        id="academy-admin-pdf-input"
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await handlePdfUpload(file);
                            e.target.value = '';
                          }
                        }}
                      />
                      
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'rgba(34, 203, 124, 0.12)',
                        color: 'var(--mint-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px'
                      }}>
                        <UploadCloud size={24} />
                      </div>

                      <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0f172a' }}>
                        {isUploadingPdf ? 'جارِ معالجة ملف الـ PDF...' : 'اضغط هنا لرفع ملف PDF من جهازك أو اسحبه وأفلته هنا'}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>
                        صيغة PDF فقط (حتى 25 ميجابايت) • يتم حفظ الملف محلياً ومزامنته للعملاء
                      </div>
                    </div>

                    {/* Or External Cloud Link */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="url"
                        placeholder="أو الصق رابط مباشر لملف PDF (مثل Google Drive, Dropbox, رابط موقع)..."
                        value={externalPdfUrl}
                        onChange={(e) => setExternalPdfUrl(e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.82rem', height: '38px', flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!externalPdfUrl.trim()) {
                            alert('يرجى إدخال رابط صالح لملف الـ PDF.');
                            return;
                          }
                          const urlName = externalPdfUrl.split('/').pop()?.split('?')[0] || 'دليل-الأكاديمية.pdf';
                          setFormData({
                            ...formData,
                            pdfFile: {
                              id: `pdf-${Date.now()}`,
                              name: urlName.endsWith('.pdf') ? urlName : `${urlName}.pdf`,
                              size: 'رابط سحابي',
                              url: externalPdfUrl.trim(),
                              uploadedAt: new Date().toISOString()
                            }
                          });
                          setExternalPdfUrl('');
                        }}
                        className="btn btn-outline"
                        style={{ padding: '0 16px', height: '38px', fontSize: '0.82rem', whiteSpace: 'nowrap', fontWeight: '700' }}
                      >
                        إرفاق الرابط
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Featured Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', fontWeight: '700' }}>
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                />
                <span>تثبيت كدرس مميز في بداية قسم الأكاديمية بالمتجر ⭐</span>
              </label>

              {/* Form Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '12px', fontWeight: '800' }}
                >
                  {editingArticle ? 'حفظ التعديلات' : 'نشر الدرس الآن 🚀'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 📖 ARTICLE PREVIEW MODAL 📖 */}
      {previewArticle && (
        <div className="modal-overlay" onClick={() => setPreviewArticle(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '0', borderRadius: '20px', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header Image */}
            <div style={{ position: 'relative', height: '240px', width: '100%' }}>
              <img
                src={previewArticle.image || '/v60_set.jpg'}
                alt={previewArticle.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                onClick={() => setPreviewArticle(null)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '16px',
                background: 'rgba(2, 44, 25, 0.92)',
                color: '#86efac',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '800'
              }}>
                {previewArticle.categoryLabel || previewArticle.category}
              </div>
            </div>

            {/* Article Content */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                <span>⏱️ {previewArticle.readTime}</span>
                <span>•</span>
                <span>🎓 {previewArticle.level}</span>
                <span>•</span>
                <span>✍️ {previewArticle.author}</span>
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--mint-950)', margin: '0 0 14px' }}>
                {previewArticle.title}
              </h2>

              <div style={{ background: 'var(--mint-50)', borderRight: '4px solid var(--mint-600)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--mint-900)', lineHeight: '1.6', marginBottom: '18px' }}>
                {previewArticle.summary}
              </div>

              {/* PDF Attached Banner in Preview */}
              {previewArticle.pdfFile && (
                <div style={{
                  background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
                  border: '1.5px solid #fecdd3',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: '#dc2626',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(220,38,38,0.25)',
                      flexShrink: 0
                    }}>
                      <FileText size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.7rem', background: '#dc2626', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: '900' }}>PDF</span>
                        <span style={{ fontWeight: '800', fontSize: '0.92rem', color: '#881337' }}>
                          {previewArticle.pdfFile.name}
                        </span>
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#9f1239' }}>
                        كتيب إرشادي مرفق ({previewArticle.pdfFile.size || 'ملف رقمي'})
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setActivePdfForReader({ pdf: previewArticle.pdfFile, title: previewArticle.title })}
                      className="btn"
                      style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Eye size={14} />
                      <span>قراءة الملف</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadPdfFile(previewArticle.pdfFile)}
                      className="btn btn-outline"
                      style={{
                        color: '#881337',
                        borderColor: '#f43f5e',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Download size={14} />
                      <span>تحميل</span>
                    </button>
                  </div>
                </div>
              )}

              <div style={{ whiteSpace: 'pre-line', fontSize: '0.94rem', lineHeight: '1.8', color: 'var(--text-main)' }}>
                {previewArticle.content}
              </div>

              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => setPreviewArticle(null)} className="btn btn-primary" style={{ padding: '8px 24px' }}>
                  إغلاق المعاينة
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 📄 Dedicated In-App PDF Reader Modal 📄 */}
      <PdfReaderModal
        isOpen={!!activePdfForReader}
        onClose={() => setActivePdfForReader(null)}
        pdf={activePdfForReader?.pdf}
        title={activePdfForReader?.title}
      />

    </div>
  );
};
