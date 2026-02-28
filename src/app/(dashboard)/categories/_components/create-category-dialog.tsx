'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { FieldLabel, FieldError, Input, Select } from '@/components/ui/form-fields';
import { createCategory } from '@/lib/actions/categories';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  type: z.enum(['income', 'expense'], {
    required_error: 'El tipo de categoría es obligatorio',
  }),
  color: z
    .string()
    .min(1, 'El color es obligatorio')
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser un hex válido (ej. #F59E0B)'),
  icon: z.enum(
    [
      'utensils',
      'car',
      'smile',
      'heart',
      'book',
      'home',
      'zap',
      'shirt',
      'more-horizontal',
      'briefcase',
      'code',
      'trending-up',
      'plus-circle',
      'tag',
    ],
    { required_error: 'El ícono es obligatorio' }
  ),
});

type FormValues = z.infer<typeof formSchema>;

const ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'utensils', label: 'Utensilios' },
  { value: 'car', label: 'Auto' },
  { value: 'smile', label: 'Sonrisa' },
  { value: 'heart', label: 'Corazón' },
  { value: 'book', label: 'Libro' },
  { value: 'home', label: 'Hogar' },
  { value: 'zap', label: 'Rayo' },
  { value: 'shirt', label: 'Camisa' },
  { value: 'more-horizontal', label: 'Más' },
  { value: 'briefcase', label: 'Maletín' },
  { value: 'code', label: 'Código' },
  { value: 'trending-up', label: 'Tendencia' },
  { value: 'plus-circle', label: 'Más círculo' },
  { value: 'tag', label: 'Etiqueta' },
];

const COLOR_PRESETS = [
  '#F59E0B',
  '#3B82F6',
  '#EC4899',
  '#DC2626',
  '#8B5CF6',
  '#10B981',
  '#06B6D4',
  '#6B7280',
];

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCategoryDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'expense',
      color: '#6B7280',
      icon: 'tag',
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = form;

  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        type: 'expense',
        color: '#6B7280',
        icon: 'tag',
      });
      setServerError(null);
    }
  }, [open, reset]);

  function handleClose() {
    reset();
    setServerError(null);
    onOpenChange(false);
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);

    const result = await createCategory({
      name: values.name,
      type: values.type,
      color: values.color,
      icon: values.icon,
      is_system_category: false,
    });

    if (!result.success) {
      setServerError(result.error);
      return;
    }

    reset();
    onSuccess();
    handleClose();
  }

  const selectedColor = watch('color');

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title="Nueva Categoría"
      description="Crea una categoría personalizada para organizar tus transacciones."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-5">
          <div>
            <FieldLabel required>Nombre</FieldLabel>
            <Input
              placeholder="ej. Suscripciones"
              autoComplete="off"
              {...register('name')}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <FieldLabel required>Tipo</FieldLabel>
            <Select {...register('type')}>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </Select>
            <FieldError message={errors.type?.message} />
          </div>

          <div>
            <FieldLabel required>Color</FieldLabel>
            <div className="flex flex-wrap gap-2 mb-2">
              {COLOR_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setValue('color', hex)}
                  className={`
                    w-8 h-8 rounded-full border-2 transition-all duration-150
                    ${selectedColor === hex ? 'border-white scale-110' : 'border-transparent'}
                  `}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
            <Input
              placeholder="#6B7280"
              maxLength={7}
              {...register('color')}
            />
            <FieldError message={errors.color?.message} />
          </div>

          <div>
            <FieldLabel required>Ícono</FieldLabel>
            <Select {...register('icon')}>
              {ICON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.icon?.message} />
          </div>
        </div>

        {serverError && (
          <div className="mt-5 px-4 py-3 rounded-[0.75rem] bg-luka-expense/10 border border-luka-expense/20 text-sm text-luka-expense">
            {serverError}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-7">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="neu-btn text-sm text-white/50 hover:text-white/80"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="neu-btn neu-btn-primary text-sm min-w-[120px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Crear Categoría'
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
