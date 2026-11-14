import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  Key,
  Check,
  Shield,
  User,
  Phone,
  Mail,
  X
} from 'lucide-react';

export const UsersPermissionsView = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    confirmDialog
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const permissionKeys = [
    { key: 'pos', label: 'نقطة البيع (POS) وإصدار الفواتير' },
    { key: 'products', label: 'إدارة المنتجات وتعديل الأسعار والتكلفة' },
    { key: 'invoices', label: 'سجل الفواتير والطباعة والإرسال واتساب' },
    { key: 'customers', label: 'دليل العملاء وسداد المديونيات' },
    { key: 'purchases', label: 'إدخال فواتير المشتريات والتوريد' },
    { key: 'suppliers', label: 'إدارة الموردين والمديونيات وكشوف الحساب' },
    { key: 'sales', label: 'تقارير المبيعات والتنبيهات الذكية والعروض' },
    { key: 'warehouse', label: 'إدارة المخزن وتسجيل الهالك والصلاحيات' },
    { key: 'accounts', label: 'الحسابات والمصروفات وصافي الأرباح' },
    { key: 'treasury', label: 'الخزينة ومحافظ إنستاباي والتحويلات' },
    { key: 'users', label: 'إدارة المستخدمين والصلاحيات' }
  ];

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'كاشير مبيعات',
    phone: '',
    email: '',
    status: 'active',
    permissions: {
      pos: true,
      products: false,
      invoices: true,
      customers: true,
      purchases: false,
      suppliers: false,
      sales: false,
      warehouse: false,
      accounts: false,
      treasury: false,
      users: false
    }
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      username: '',
      password: '',
      role: 'كاشير مبيعات',
      phone: '',
      email: '',
      status: 'active',
      permissions: {
        pos: true,
        products: false,
        invoices: true,
        customers: true,
        purchases: false,
        sales: false,
        warehouse: false,
        accounts: false,
        users: false
      }
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    const resolvedRole = user.roleLabel || (user.role === 'manager' ? 'مدير فرع / عمليات' : user.role === 'cashier' ? 'كاشير مبيعات' : user.role === 'inventory' ? 'أمين مستودع ومخزون' : user.role) || '';
    setFormData({
      fullName: user.fullName,
      username: user.username,
      password: '',
      role: resolvedRole,
      phone: user.phone || '',
      email: user.email || '',
      status: user.status || 'active',
      permissions: user.permissions || {}
    });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey]
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username) {
      alert('يرجى ملء الاسم الكامل واسم المستخدم');
      return;
    }

    if (!editingUser && (!formData.password || formData.password.trim().length < 4)) {
      alert('يرجى إدخال كلمة مرور للمستخدم الجديد (4 خانات على الأقل)');
      return;
    }

    const assignedRole = formData.role?.trim() || 'كاشير مبيعات';

    if (editingUser) {
      const updatePayload = {
        ...formData,
        role: assignedRole,
        roleLabel: assignedRole,
        username: formData.username.trim()
      };
      if (formData.password && formData.password.trim() !== '' && formData.password !== '••••••••') {
        updatePayload.password = formData.password.trim();
      } else {
        delete updatePayload.password;
      }

      updateUser(editingUser.id, updatePayload);
      alert('تم تحديث بيانات وصلاحيات المستخدم بنجاح!');
    } else {
      addUser({
        ...formData,
        role: assignedRole,
        roleLabel: assignedRole,
        username: formData.username.trim(),
        password: formData.password.trim()
      });
      alert('تم إضافة المستخدم وتعيين صلاحياته بنجاح!');
    }
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
            إدارة الحسابات وفريق العمل والصلاحيات
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            التحكم في وصول الموظفين وتخصيص صلاحيات الكاشير والإدارة مع حماية حساب المالك (Owner)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn btn-primary"
          style={{ height: '42px' }}
        >
          <UserPlus size={18} />
          <span>+ إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>المستخدم والاسم</th>
              <th>اسم الدخول (Username)</th>
              <th>الدور الوظيفي</th>
              <th>رقم الهاتف</th>
              <th>حالة الحساب</th>
              <th>الصلاحيات الممنوحة</th>
              <th style={{ textAlign: 'center' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const activePermsCount = Object.values(u.permissions || {}).filter(Boolean).length;

              return (
                <tr key={u.id} style={{ background: u.isOwner ? 'var(--mint-50)' : undefined }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: u.isOwner ? '#fef3c7' : 'var(--mint-100)',
                          border: u.isOwner ? '2px solid #f59e0b' : '1px solid var(--border-mint)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem'
                        }}
                      >
                        {u.avatar || '👤'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{u.fullName}</strong>
                          {u.isOwner && (
                            <span
                              style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '0.7rem',
                                fontWeight: '800'
                              }}
                            >
                              👑 المالك (غير قابل للحذف)
                            </span>
                          )}
                        </div>
                        {u.email && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                      @{u.username}
                    </code>
                  </td>
                  <td>
                    <span className="badge badge-mint" style={{ fontSize: '0.78rem' }}>
                      {u.isOwner ? '👑 مالك المشروع' : (u.roleLabel || (u.role === 'manager' ? 'مدير فرع' : u.role === 'cashier' ? 'كاشير مبيعات' : u.role === 'inventory' ? 'أمين مستودع' : u.role) || 'موظف')}
                    </span>
                  </td>
                  <td dir="ltr" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    {u.phone || '-'}
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'active' ? 'badge-mint' : 'badge-danger'}`}>
                      {u.status === 'active' ? 'نشط ومفعل' : 'معطل'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--mint-800)', fontWeight: '700' }}>
                      {u.isOwner ? 'كامل الصلاحيات (9/9)' : `${activePermsCount} من 9 صلاحيات`}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        <Edit2 size={14} />
                        <span>تعديل والصلاحيات</span>
                      </button>

                      {/* Delete button (Disabled ONLY if it's the sole remaining owner) */}
                      {!(u.isOwner && users.filter(usr => usr.isOwner).length <= 1) ? (
                        <button
                          onClick={async () => {
                            const ok = await confirmDialog({
                              title: 'حذف حساب المستخدم',
                              message: `هل أنت متأكد من حذف حساب "${u.fullName}"؟`,
                              details: `اسم الدخول: @${u.username} • لن يتمكن هذا المستخدم من الدخول للنظام بعد الحذف.`,
                              confirmText: 'نعم، حذف الحساب',
                              cancelText: 'إلغاء',
                              type: 'danger'
                            });
                            if (ok) {
                              deleteUser(u.id);
                            }
                          }}
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          title="حذف المستخدم"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="btn"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            background: '#f1f5f9',
                            color: '#94a3b8',
                            border: '1px solid #e2e8f0',
                            cursor: 'not-allowed'
                          }}
                          title="حساب المالك الأخير محمي للحفاظ على أمان النظام"
                        >
                          محمي
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD / EDIT USER & PERMISSIONS */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '640px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                  {editingUser ? `تعديل بيانات وصلاحيات: ${editingUser.fullName}` : 'إضافة مستخدم جديد للنظام'}
                </h3>
                {editingUser?.isOwner && (
                  <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: '700', marginTop: '2px' }}>
                    👑 هذا هو حساب المالك الأساسي للنظام
                  </div>
                )}
              </div>
              <button onClick={() => setIsModalOpen(false)} className="btn-icon" style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Name & Username */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: صالح القحطاني"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">اسم المستخدم للدخول (Username) *</label>
                  <input
                    type="text"
                    required
                    placeholder="owner, cashier..."
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Password & Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{editingUser ? 'تغيير كلمة المرور' : 'كلمة المرور *'}</label>
                  <input
                    type="password"
                    placeholder={editingUser ? "اتركها فارغة للإبقاء عليها دون تغيير" : "كلمة مرور قوية (4 خانات فأكثر)"}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>الدور الوظيفي *</label>
                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 'bold' }}>
                      ✍️ اكتب أي مسمى بحرية
                    </span>
                  </div>
                  <input
                    type="text"
                    list="role-suggestions"
                    disabled={editingUser?.isOwner}
                    placeholder="اكتب الدور الوظيفي (مثال: كاشير، باريستا، محاسب...)"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="form-input"
                    autoComplete="off"
                  />
                  <datalist id="role-suggestions">
                    {editingUser?.isOwner && <option value="المالك الأساسي (Owner)" />}
                    <option value="كاشير مبيعات" />
                    <option value="مدير فرع / عمليات" />
                    <option value="باريستا متخصص" />
                    <option value="أمين مستودع ومخزون" />
                    <option value="محاسب مالي" />
                    <option value="مشرف صالة وخدمة" />
                    <option value="مسؤول مشتريات" />
                  </datalist>

                  {/* اقتراحات سريعة بنقرة واحدة */}
                  {!editingUser?.isOwner && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                      {['كاشير مبيعات', 'مدير فرع', 'باريستا', 'أمين مستودع', 'محاسب'].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: sug })}
                          style={{
                            background: formData.role === sug ? 'var(--mint-600, #059669)' : 'rgba(255,255,255,0.06)',
                            color: formData.role === sug ? '#ffffff' : 'var(--text-muted)',
                            border: `1px solid ${formData.role === sug ? 'var(--mint-500, #10b981)' : 'rgba(255,255,255,0.12)'}`,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Phone & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">رقم الجوال</label>
                  <input
                    type="tel"
                    placeholder="05XXXXXXXX"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">حالة الحساب</label>
                  <select
                    disabled={editingUser?.isOwner}
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="active">مفعل ونشط</option>
                    <option value="inactive">معطل وموقوف</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div style={{ border: '1px solid var(--border-mint)', borderRadius: '12px', padding: '14px', background: 'var(--mint-50)' }}>
                <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--mint-900)', marginBottom: '10px' }}>
                  🔐 الصلاحيات الممنوحة للمستخدم:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {permissionKeys.map(perm => {
                    const isChecked = editingUser?.isOwner || formData.permissions[perm.key];

                    return (
                      <label
                        key={perm.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#ffffff',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isChecked ? '1px solid var(--mint-400)' : '1px solid var(--border-light)',
                          cursor: editingUser?.isOwner ? 'not-allowed' : 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: isChecked ? '700' : '500',
                          color: isChecked ? 'var(--mint-900)' : 'var(--text-secondary)'
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={editingUser?.isOwner}
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.key)}
                          style={{ accentColor: 'var(--mint-600)', width: '16px', height: '16px' }}
                        />
                        <span>{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={18} />
                  <span>{editingUser ? 'حفظ التعديلات وكلمة السر' : 'إنشاء المستخدم وتفعيل الصلاحيات'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
