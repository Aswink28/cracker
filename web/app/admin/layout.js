import AdminShell from '@/components/admin/AdminShell';

/**
 * The admin panel is a separate section of the app.
 *
 * Everything under this route is client-rendered and code-split by the router,
 * so none of the admin UI, its forms or axios are downloaded by a customer
 * browsing the catalogue. noindex is enforced here in metadata and again as an
 * X-Robots-Tag header in next.config.mjs.
 */
export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
