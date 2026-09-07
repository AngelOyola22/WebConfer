import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './RegisterPage.css';

const schema = z.object({
  first_name: z.string().min(2, 'Ingresa al menos 2 caracteres'),
  last_name: z.string().min(2, 'Ingresa al menos 2 caracteres'),
  age: z.number({ error: 'Ingresa tu edad' }).int().min(16, 'Debes tener al menos 16 anos').max(100, 'Edad invalida'),
  email: z.string().email('Ingresa un correo valido'),
  phone: z.string().min(7, 'Ingresa al menos 7 digitos').max(20),
  payment_proof: z.any().refine((f) => f instanceof FileList && f.length > 0, 'El comprobante de pago es obligatorio'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const file = (data.payment_proof as FileList)[0];
      const ext = file.name.split('.').pop();
      const rand = Math.random().toString(36).slice(2);
      const fileName = 'comprobantes/' + Date.now() + '-' + rand + '.' + ext;

      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('registrations').insert({
        first_name: data.first_name,
        last_name: data.last_name,
        age: data.age,
        email: data.email,
        phone: data.phone,
        payment_proof_url: urlData.publicUrl,
        status: 'pending',
      });
      if (insertError) throw insertError;
      navigate('/registro/exitoso');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrio un error. Intentalo de nuevo.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-page__bg" />
      <div className="container-sm">
        <div className="register-header animate-fade-in-up">
          <Link to="/" className="back-link">&larr; Volver al inicio</Link>
          <div className="register-badge">Formulario de Inscripcion</div>
          <h1>Completa tu Registro</h1>
          <p>Llena el formulario y adjunta tu comprobante de pago. Te confirmaremos por correo.</p>
        </div>

        <div className="card register-card animate-fade-in-up stagger-2">
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)' }}>{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Nombres <span>*</span></label>
                <input id="first_name" {...register('first_name')} className={`form-input ${errors.first_name ? 'error' : ''}`} placeholder="Ej: Carlos Alberto" />
                {errors.first_name && <span className="form-error">{errors.first_name.message as string}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Apellidos <span>*</span></label>
                <input id="last_name" {...register('last_name')} className={`form-input ${errors.last_name ? 'error' : ''}`} placeholder="Ej: Ramirez Torres" />
                {errors.last_name && <span className="form-error">{errors.last_name.message as string}</span>}
              </div>
            </div>

            <div className="grid-2" style={{ gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Edad <span>*</span></label>
                <input id="age" type="number" {...register('age', { valueAsNumber: true })} className={`form-input ${errors.age ? 'error' : ''}`} placeholder="Ej: 32" min={16} max={100} />
                {errors.age && <span className="form-error">{errors.age.message as string}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Telefono <span>*</span></label>
                <input id="phone" {...register('phone')} className={`form-input ${errors.phone ? 'error' : ''}`} placeholder="Ej: +51 999 123 456" />
                {errors.phone && <span className="form-error">{errors.phone.message as string}</span>}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <label className="form-label">Correo Electronico <span>*</span></label>
              <input id="email" type="email" {...register('email')} className={`form-input ${errors.email ? 'error' : ''}`} placeholder="correo@ejemplo.com" />
              {errors.email && <span className="form-error">{errors.email.message as string}</span>}
            </div>

            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <label className="form-label">Comprobante de Pago <span>*</span></label>
              <div className={`file-upload ${preview ? 'file-upload--filled' : ''} ${errors.payment_proof ? 'error' : ''}`}>
                <input id="payment_proof" type="file" accept="image/*,.pdf" {...register('payment_proof')} onChange={handleFileChange} className="file-upload__input" />
                {preview ? (
                  <div className="file-upload__preview">
                    <img src={preview} alt="Comprobante" />
                    <span className="file-upload__change">Cambiar imagen</span>
                  </div>
                ) : (
                  <div className="file-upload__placeholder">
                    <div className="file-upload__icon">📎</div>
                    <p><strong>Haz clic para seleccionar</strong> o arrastra aqui</p>
                    <p className="file-upload__hint">JPG, PNG o PDF &middot; Max 10MB</p>
                  </div>
                )}
              </div>
              {errors.payment_proof && <span className="form-error">{errors.payment_proof.message as string}</span>}
            </div>

            <button id="submit-registration" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-6)' }} disabled={loading}>
              {loading ? <><div className="spinner" /> Enviando inscripcion...</> : 'Enviar mi Inscripcion'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-6)' }}>
          Tus datos estan protegidos y solo seran usados para gestionar tu inscripcion.
        </p>
      </div>
    </div>
  );
}