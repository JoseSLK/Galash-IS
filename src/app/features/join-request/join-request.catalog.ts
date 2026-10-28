export interface JoinField {
  key: string;
  label: string;
  type: 'text' | 'tel' | 'date' | 'url' | 'select';
  options?: readonly { value: string; label: string }[];
  numeric?: boolean;
  optional?: boolean;
}

// TEMPORAL: sustituir estos catálogos cuando estén disponibles los definitivos.
export const temporaryCatalogs = {
  education: ['Bachillerato', 'Técnico', 'Tecnólogo', 'Pregrado', 'Especialización', 'Maestría', 'Doctorado'],
  affiliation: ['Estudiante', 'Docente', 'Egresado', 'Investigador externo'],
  researcher: ['Sin categoría', 'Investigador Junior', 'Investigador Asociado', 'Investigador Senior'],
  calls: ['Sin participación', 'Convocatoria 2024 (ejemplo)', 'Convocatoria 2025 (ejemplo)', 'Convocatoria 2026 (ejemplo)']
} as const;
const options = (values: readonly string[]) => values.map(value => ({ value, label: value }));

export const joinSteps: { label: string; title: string; accent: string; help: string; fields: JoinField[] }[] = [
  { label: 'Datos personales', title: 'Comencemos por', accent: 'conocerte', help: 'Cuéntanos quién eres para iniciar tu solicitud.', fields: [
    { key: 'fullName', label: 'Nombre completo', type: 'text' },
    { key: 'document', label: 'C.C.', type: 'text', numeric: true },
    { key: 'studentCode', label: 'COD. (código estudiantil)', type: 'text', numeric: true },
    { key: 'phone', label: 'Teléfono', type: 'tel', numeric: true },
    { key: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
    { key: 'birthPlace', label: 'Lugar de nacimiento', type: 'text' },
    { key: 'address', label: 'Dirección de residencia', type: 'text' }
  ] },
  { label: 'Formación', title: 'Tu formación', accent: 'académica', help: 'Comparte tu recorrido académico y tu vinculación actual.', fields: [
    { key: 'education', label: 'Máximo nivel de estudio', type: 'select', options: options(temporaryCatalogs.education) },
    { key: 'educationTitle', label: 'Título máximo nivel de estudio', type: 'text' },
    { key: 'undergraduateTitle', label: 'Título de pregrado', type: 'text' },
    { key: 'affiliation', label: 'Vinculación', type: 'select', options: options(temporaryCatalogs.affiliation) }
  ] },
  { label: 'Investigación', title: 'Tu camino en la', accent: 'investigación', help: 'Conozcamos tus perfiles de investigación y el semillero que te interesa.', fields: [
    { key: 'cvlac', label: 'Link CvLAC', type: 'url' },
    { key: 'orcid', label: 'Link ORCID', type: 'url' },
    { key: 'researcherCategory', label: 'Categoría actual de investigador', type: 'select', options: options(temporaryCatalogs.researcher) },
    { key: 'call', label: 'Convocatoria MinCiencias', type: 'select', options: options(temporaryCatalogs.calls) },
    // Options come from GET /seedbeds at runtime.
    { key: 'seedbed', label: 'Semillero de interés', type: 'select', optional: true, options: [] }
  ] },
  { label: 'Revisar y enviar', title: 'Tu solicitud, lista para', accent: 'revisar', help: 'Comprueba tus datos antes de radicar la solicitud.', fields: [] }
];
