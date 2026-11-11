import {ContentPage} from '../../core/models/institutional.model';
export interface LetraGalash { letra: string; significado: string; }
export interface FotoGaleria { titulo: string; imagenUrl: string; imagenAlt: string; }
export interface AreaConocimiento { id: 'auditoria' | 'logica' | 'software' | 'hardware'; nombre: string; descripcion: string; }
export interface ContenidoInstitucional {
  etiqueta: string; titulo: string; descripcion: string; presentacion: string;
  logoUrl: string; letras: LetraGalash[]; mision: string; vision: string; objetivos: string[];
  galeriaTitulo: string; galeria: FotoGaleria[]; areas: AreaConocimiento[];
}
export type CategoriaEnlace = 'Redes sociales' | 'CvLAC' | 'GrupLAC' | 'MinCiencias' | 'Repositorios';
export interface EnlaceOficial { categoria: CategoriaEnlace; nombre: string; descripcion: string; url: string; activo: boolean; }
export interface UbicacionInstitucional { nombre: string; direccion: string; ciudad: string; fuenteUrl: string; }
export interface DatosInstitucionales { pages?:ContentPage[]; ubicacion?: UbicacionInstitucional; contenido: ContenidoInstitucional; enlaces: EnlaceOficial[]; autor: string; actualizadoEn: string; }
