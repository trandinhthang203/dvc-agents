/**
 * DynamicForm – renders a form from a backend `dynamic_form` payload.
 * Supported field types: string | number | textarea | boolean | select:<opts>
 */

import React, { useState } from 'react';
import { CheckCircle2, Loader2, AlertTriangle, Send } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DynamicFormField {
    field_id: string;
    label: string;
    type: string; // 'string' | 'number' | 'textarea' | 'boolean' | 'select:<opt1>,<opt2>'
    required: boolean;
    placeholder?: string;
    x?: number | null;
    y?: number | null;
}

export interface DynamicFormPayload {
    kind: 'dynamic_form';
    request_id: string;
    title: string;
    description?: string;
    submit_label?: string;
    pdf_path?: string | null;
    fields: DynamicFormField[];
}

interface DynamicFormProps {
    payload: DynamicFormPayload;
    /** Called when user submits the form. Returns submitted values. */
    onSubmit: (requestId: string, values: Record<string, string | boolean>) => void;
    /** True while the parent is processing the submission */
    submitting?: boolean;
    /** True once the form has been successfully submitted */
    submitted?: boolean;
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function parseSelectOptions(type: string): string[] {
    const raw = type.slice('select:'.length);
    return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export const DynamicForm: React.FC<DynamicFormProps> = ({
    payload,
    onSubmit,
    submitting = false,
    submitted = false,
}) => {
    const initialValues = () =>
        Object.fromEntries(
            payload.fields.map((f) => [
                f.field_id,
                f.type === 'boolean' ? false : '',
            ])
        ) as Record<string, string | boolean>;

    const [values, setValues] = useState<Record<string, string | boolean>>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Validation ──────────────────────────────────────────────────────────────
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        for (const field of payload.fields) {
            const val = values[field.field_id];
            if (field.required && field.type !== 'boolean') {
                if (typeof val === 'string' && val.trim() === '') {
                    newErrors[field.field_id] = `${field.label} không được để trống.`;
                    continue;
                }
            }
            if (field.type === 'number' && typeof val === 'string' && val.trim() !== '') {
                if (isNaN(Number(val))) {
                    newErrors[field.field_id] = `${field.label} phải là số.`;
                }
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── Handlers ────────────────────────────────────────────────────────────────
    const handleChange = (fieldId: string, value: string | boolean) => {
        setValues((prev) => ({ ...prev, [fieldId]: value }));
        if (errors[fieldId]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[fieldId];
                return next;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate() || submitting || submitted) return;
        onSubmit(payload.request_id, values);
    };

    const baseInput =
        'w-full bg-white/80 rounded-lg border border-outline-variant/40 ' +
        'px-3 py-2 text-sm text-on-surface placeholder:text-secondary/40 ' +
        'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 ' +
        'transition-all duration-150 shadow-sm ';

    const renderField = (field: DynamicFormField) => {
        const hasError = Boolean(errors[field.field_id]);
        const inputClass = baseInput + (hasError ? 'border-red-500/60 focus:ring-red-500/30 ' : '');

        if (field.type === 'boolean') {
            return (
                <label key={field.field_id} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input
                            id={`field-${field.field_id}`}
                            type="checkbox"
                            checked={values[field.field_id] as boolean}
                            onChange={(e) => handleChange(field.field_id, e.target.checked)}
                            disabled={submitted || submitting}
                            className="sr-only peer"
                        />
                        <div
                            className={`w-9 h-5 rounded-full border-2 transition-all duration-200 flex items-center
                                ${values[field.field_id]
                                    ? 'bg-primary border-primary'
                                    : 'bg-surface-container border-outline-variant/40 group-hover:border-primary/50'
                                }`}
                        >
                            <div
                                className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-200
                                    ${values[field.field_id] ? 'translate-x-4' : 'translate-x-0.5'}`}
                            />
                        </div>
                    </div>
                    <span className="text-sm font-medium text-on-surface">{field.label}</span>
                </label>
            );
        }

        if (field.type === 'textarea') {
            return (
                <textarea
                    id={`field-${field.field_id}`}
                    value={values[field.field_id] as string}
                    onChange={(e) => handleChange(field.field_id, e.target.value)}
                    placeholder={field.placeholder}
                    disabled={submitted || submitting}
                    rows={3}
                    className={`${inputClass} resize-none`}
                />
            );
        }

        if (field.type.startsWith('select:')) {
            const options = parseSelectOptions(field.type);
            return (
                <select
                    id={`field-${field.field_id}`}
                    value={values[field.field_id] as string}
                    onChange={(e) => handleChange(field.field_id, e.target.value)}
                    disabled={submitted || submitting}
                    className={`${inputClass} appearance-none cursor-pointer`}
                >
                    <option value="">— Chọn {field.label} —</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        }

        return (
            <input
                id={`field-${field.field_id}`}
                type={field.type === 'number' ? 'number' : 'text'}
                value={values[field.field_id] as string}
                onChange={(e) => handleChange(field.field_id, e.target.value)}
                placeholder={field.placeholder}
                disabled={submitted || submitting}
                className={inputClass}
            />
        );
    };

    return (
        <div className="dynamic-form-card">
            <div className="dynamic-form-header">
                <div className="dynamic-form-header-accent" />
                <div className="dynamic-form-header-content">
                    <h3 className="dynamic-form-title">{payload.title}</h3>
                    {payload.description && (
                        <p className="dynamic-form-description">{payload.description}</p>
                    )}
                </div>
            </div>

            <div className="dynamic-form-body">
                {submitted ? (
                    <div className="dynamic-form-submitted">
                        <CheckCircle2 size={28} className="text-emerald-500 shrink-0" />
                        <div>
                            <p className="font-semibold text-sm text-on-surface">Đã gửi thành công!</p>
                            <p className="text-xs text-secondary mt-0.5">Thông tin của bạn đang được xử lý...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
                        {payload.fields.map((field) => (
                            <div key={field.field_id} className="flex flex-col gap-1">
                                {field.type !== 'boolean' && (
                                    <label
                                        htmlFor={`field-${field.field_id}`}
                                        className="text-xs font-semibold text-on-surface-variant tracking-wide"
                                    >
                                        {field.label}
                                        {field.required && <span className="text-red-400 ml-0.5">*</span>}
                                    </label>
                                )}
                                {renderField(field)}
                                {errors[field.field_id] && (
                                    <p className="dynamic-form-error">
                                        <AlertTriangle size={11} />
                                        {errors[field.field_id]}
                                    </p>
                                )}
                            </div>
                        ))}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="dynamic-form-submit mt-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Send size={14} />
                                    {payload.submit_label ?? 'Gửi'}
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
