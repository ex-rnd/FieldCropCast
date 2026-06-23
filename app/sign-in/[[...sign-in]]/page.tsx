import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="text-center mb-2">
        <div className="text-3xl font-black tracking-tight mb-1" style={{ color: 'var(--green)' }}>
          🌾 FieldCropCast
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Farm Weather Intelligence
        </p>
      </div>
      <SignIn />
    </div>
  );
}
