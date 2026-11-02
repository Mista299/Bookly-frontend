import { serviceService } from './service';
import type { Booking } from '$lib/types/booking';
import type { Service, ProfessionalSummary } from '$lib/types/service';

/**
 * El backend no devuelve `serviceName`, `professionalName` ni `customerName`
 * en `BookingResponse` (ver BUGS-BACKEND.md). El frontend resuelve los nombres
 * cruzando los ids contra los catálogos, de modo que la UI nunca muestre los
 * placeholders "Servicio" / "Profesional" / "Cliente".
 *
 * Se cachea por sesión para no repetir las peticiones en cada render.
 */

let servicesCache: Service[] | null = null;
let servicesPromise: Promise<Service[]> | null = null;

/** profesionales por servicio: serviceId → resumen de profesionales */
const prosByService = new Map<string, ProfessionalSummary[]>();
/** profesionales ya resueltos: professionalId → nombre */
const proNameCache = new Map<string, string>();

export function invalidateBookingNamesCache(): void {
  servicesCache = null;
  servicesPromise = null;
  prosByService.clear();
  proNameCache.clear();
}

async function loadServices(): Promise<Service[]> {
  if (servicesCache) return servicesCache;
  if (!servicesPromise) {
    servicesPromise = serviceService
      .list()
      .then((list) => {
        servicesCache = list;
        return list;
      })
      .catch(() => [] as Service[])
      .finally(() => {
        servicesPromise = null;
      });
  }
  return servicesPromise;
}

/**
 * Los profesionales de un servicio se obtienen con /servicios/{id}/profesionales.
 * Un CUSTOMER sí tiene acceso a ese endpoint (a diferencia de /profesionales).
 */
async function loadProfessionalsFor(serviceId: string): Promise<ProfessionalSummary[]> {
  const cached = prosByService.get(serviceId);
  if (cached) return cached;
  try {
    const list = await serviceService.listProfessionals(serviceId);
    prosByService.set(serviceId, list);
    for (const p of list) proNameCache.set(p.id, p.fullName);
    return list;
  } catch {
    prosByService.set(serviceId, []);
    return [];
  }
}

/**
 * Enriquece las reservas con el nombre del servicio y del profesional.
 * Devuelve las mismas reservas si no se puede resolver nada: la UI degrada
 * con elegancia en lugar de romperse.
 */
export async function enrichBookings(bookings: Booking[]): Promise<Booking[]> {
  if (bookings.length === 0) return bookings;

  const services = await loadServices();
  if (services.length === 0) return bookings;

  const svcById = new Map(services.map((s) => [s.id, s]));

  // ids de servicio que aparecen en las reservas y aún no resolvímos.
  const pending = new Set<string>();
  for (const b of bookings) {
    if (!b.serviceName && svcById.has(b.serviceId)) pending.add(b.serviceId);
  }
  await Promise.all([...pending].map((id) => loadProfessionalsFor(id)));

  return bookings.map((b) => {
    const svc = svcById.get(b.serviceId);
    const proName = proNameCache.get(b.professionalId);
    return {
      ...b,
      serviceName: b.serviceName ?? svc?.name ?? undefined,
      professionalName: b.professionalName ?? proName ?? undefined
    };
  });
}

/**
 * Nombres de los profesionales de una lista de reservas, usando un catálogo
 * ya cargado (el caso del profesional, que sí puede listar /profesionales).
 */
export function enrichWithProfessionalCatalog(
  bookings: Booking[],
  professionals: ProfessionalSummary[]
): Booking[] {
  if (bookings.length === 0 || professionals.length === 0) return bookings;
  const byId = new Map(professionals.map((p) => [p.id, p]));
  return bookings.map((b) => {
    if (b.professionalName) return b;
    const p = byId.get(b.professionalId);
    return p ? { ...b, professionalName: p.fullName } : b;
  });
}
