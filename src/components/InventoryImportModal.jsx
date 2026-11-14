import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  CheckCircle2
} from 'lucide-react';
import { parseInventoryFile } from '../utils/exportUtils';
import { normalizeArabic } from '../utils/numberEnforcer';

/**
 * Parse an uploaded Excel / CSV / TSV file and enrich rows against existing products
 * so the preview modal clearly marks matched updates vs brand-new items.
 */
export const processInventoryUploadFile = async (file, products = []) => {
  const parsed = await parseInventoryFile(file);
  if (!parsed || parsed.length === 0) {
    return null;
  }

  const enriched = parsed.map(item => {
    const match = (products || []).find(p =>
      (item.sku && p.sku && String(p.sku).trim().toLowerCase() === String(item.sku).trim().toLowerCase()) ||
      (item.name && p.name && normalizeArabic(p.name) === normalizeArabic(item.name)) ||
      (item.nameEn && p.nameEn && String(p.nameEn).trim().toLowerCase() === String(item.nameEn).trim().toLowerCase())
    );
    const currentStock = match
      ? (match.stock !== undefined ? Number(match.stock) : (match.stockGram ? match.stockGram / 1000 : 0))
      : null;

    return {
      ...item,
      isNew: !match,
      matchedProduct: match,
      currentStock,
      diff: currentStock !== null ? Number((item.stock - currentStock).toFixed(2)) : null
    };
  });

  const matchedIds = new Set(enriched.filter(e => e.matchedProduct).map(e => e.matchedProduct.id));
  const missingProducts = (products || []).filter(p => !matchedIds.has(p.id));

  return {
    fileName: file.name,
    items: enriched,
    missingProducts
  };
};

/**
 * Reusable success toast banner after confirming an inventory/products file import
 */
export const InventoryImportSuccessBanner = ({ alertData, onClose }) => {
  if (!alertData) return null;
  return (
    <div style={{
      background: '#F0FDF4',
      border: '1.5px solid #86EFAC',
      borderRadius: '14px',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      boxShadow: '0 4px 16px rgba(22, 101, 52, 0.08)',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
          <CheckCircle2 size={22} />
        </div>
        <div>
          <div style={{ fontWeight: '900', color: '#14532D', fontSize: '0.95rem' }}>
            تم تحديث المخزن والمنتجات بنجاح من الملف!
          </div>
          <div style={{ fontSize: '0.82rem', color: '#166534', marginTop: '2px' }}>
            تم تحديث رصيد <strong>{alertData.updated}</strong> صنف مسجل، وإضافة وعرض <strong>{alertData.added}</strong> صنف جديد في النظام والمتجر
            {alertData.removed > 0 && (
              <>، وحذف <strong>{alertData.removed}</strong> صنف غير موجود بالشيت</>
            )}.
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="btn-icon"
        style={{ width: '30px', height: '30px', color: '#166534' }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

/**
 * Reusable preview and confirmation modal for Excel / CSV product & stock imports
 */
export const InventoryImportModal = ({ isOpen, previewData, onClose, onConfirm }) => {
  const [removeMissing, setRemoveMissing] = useState(true);

  useEffect(() => {
    if (isOpen) setRemoveMissing(true);
  }, [isOpen, previewData?.fileName]);

  if (!isOpen || !previewData) return null;

  const updatedCount = previewData.items.filter(i => !i.isNew).length;
  const newCount = previewData.items.filter(i => i.isNew).length;
  const missingCount = (previewData.missingProducts || []).length;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1300 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '920px',
          width: '95%',
          padding: '24px',
          borderRadius: '20px',
          background: '#FFFFFF',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #EAE0D5', paddingBottom: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#2D1810' }}>
                معاينة استيراد المنتجات والمخزون من الشيت
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#8C7A6B', marginTop: '2px' }}>
                الملف: <strong>{previewData.fileName}</strong> • إجمالي الأصناف المقروءة: <strong>{previewData.items.length}</strong>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{ width: '34px', height: '34px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Stat Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: '700' }}>إجمالي الصفوف بالشيت</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0F172A', marginTop: '4px' }}>
              {previewData.items.length} صنف
            </div>
          </div>

          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: '700' }}>أصناف مسجلة (تحديث)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#15803D', marginTop: '4px' }}>
              {updatedCount} صنف مسجل
            </div>
          </div>

          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ fontSize: '0.78rem', color: '#1E40AF', fontWeight: '700' }}>أصناف جديدة (تُقبل وتُعرض)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#2563EB', marginTop: '4px' }}>
              {newCount} صنف جديد
            </div>
          </div>

          <div style={{
            background: removeMissing ? '#FEF2F2' : '#F8FAFC',
            border: `1px solid ${removeMissing ? '#FECACA' : '#E2E8F0'}`,
            borderRadius: '12px',
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: '0.78rem', color: removeMissing ? '#991B1B' : '#64748B', fontWeight: '700' }}>
              {removeMissing ? 'أصناف ستُحذف (غير موجودة بالشيت)' : 'أصناف غير موجودة بالشيت'}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: removeMissing ? '#DC2626' : '#64748B', marginTop: '4px' }}>
              {missingCount} صنف
            </div>
          </div>
        </div>

        {/* Items Preview Table */}
        <div style={{ border: '1px solid #EAE0D5', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
          <table className="table" style={{ margin: 0, fontSize: '0.86rem' }}>
            <thead style={{ background: '#FAF7F2', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>الكود (SKU)</th>
                <th>اسم المنتج</th>
                <th>نوع الوحدة</th>
                <th>الرصيد الحالي</th>
                <th>الرصيد الجديد بالشيت</th>
                <th>التغير في الرصيد</th>
                <th>سعر البيع</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {previewData.items.map((it, idx) => {
                const isWeight = it.unitType === 'weight';
                const unitSuffix = isWeight ? 'كجم' : 'ق';
                const diff = it.diff;

                return (
                  <tr key={idx} style={{ background: it.isNew ? '#F8FAFC' : '#ffffff' }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '700', color: '#6F4E37' }}>
                      {it.sku || '—'}
                    </td>
                    <td style={{ fontWeight: '800', color: '#2D1810' }}>
                      {it.name}
                      {it.nameEn && <div style={{ fontSize: '0.72rem', color: '#8C7A6B' }}>{it.nameEn}</div>}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#4B5563' }}>
                        {isWeight ? 'وزن (كجم)' : 'بالقطعة'}
                      </span>
                    </td>
                    <td style={{ color: '#64748B', fontWeight: '700' }}>
                      {it.currentStock !== null ? `${it.currentStock} ${unitSuffix}` : '—'}
                    </td>
                    <td style={{ fontWeight: '900', color: '#0F172A' }}>
                      {it.stock} {unitSuffix}
                    </td>
                    <td>
                      {it.isNew ? (
                        <span style={{ color: '#2563EB', fontWeight: '800', fontSize: '0.78rem' }}>+ صنف جديد</span>
                      ) : diff > 0 ? (
                        <span style={{ color: '#16A34A', fontWeight: '800', fontSize: '0.8rem' }}>+{diff} {unitSuffix}</span>
                      ) : diff < 0 ? (
                        <span style={{ color: '#DC2626', fontWeight: '800', fontSize: '0.8rem' }}>{diff} {unitSuffix}</span>
                      ) : (
                        <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>بدون تغيير</span>
                      )}
                    </td>
                    <td style={{ fontWeight: '700', color: '#15803D' }}>
                      {it.sellingPrice ? `${it.sellingPrice.toLocaleString()} ج.م` : '—'}
                    </td>
                    <td>
                      {it.isNew ? (
                        <span style={{ background: '#DBEAFE', color: '#1E40AF', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '800' }}>
                          صنف جديد (يُضاف)
                        </span>
                      ) : (
                        <span style={{ background: '#DCFCE7', color: '#15803D', padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: '800' }}>
                          تحديث رصيد
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Remove missing products toggle */}
        {missingCount > 0 && (
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: removeMissing ? '#FEF2F2' : '#F8FAFC',
            border: `1px solid ${removeMissing ? '#FECACA' : '#E2E8F0'}`,
            marginBottom: '14px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: '800',
            color: removeMissing ? '#991B1B' : '#475569'
          }}>
            <input
              type="checkbox"
              checked={removeMissing}
              onChange={(e) => setRemoveMissing(e.target.checked)}
              style={{ width: '17px', height: '17px', accentColor: '#DC2626', cursor: 'pointer' }}
            />
            <span>
              حذف المنتجات الحالية غير الموجودة في الشيت تلقائياً ({missingCount} صنف)
            </span>
          </label>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
            {removeMissing && missingCount > 0
              ? `سيتم اعتماد أصناف الشيت فقط وحذف ${missingCount} صنف غير موجود فيه من المخزن والمتجر.`
              : 'سيتم حفظ جميع التحديثات والأصناف الجديدة تلقائياً في المخزن والمنتجات ومتجر العملاء.'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ padding: '8px 18px' }}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => onConfirm(removeMissing)}
              className="btn btn-primary"
              style={{
                padding: '8px 24px',
                background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
                borderColor: '#15803D',
                fontWeight: '800',
                fontSize: '0.92rem',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={18} />
              <span>تأكيد واعتماد الملف الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
