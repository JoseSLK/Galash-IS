/** `palabra` nombra la letra (botón); `frase` completa en pantalla el título "Grupo de investigación en". */
export interface LetraInteractiva { id: string; letra: string; etiqueta: string; palabra: string; frase: string; }
export const LETRAS_GALASH: readonly LetraInteractiva[] = [
 {id:'grupo',letra:'G',etiqueta:'LETRA 1 · GRUPO',palabra:'Grupo',frase:'Auditoría, Lógica y Arquitectura de Software y Hardware'},
 {id:'auditoria',letra:'A',etiqueta:'LETRA 2 · ÁREA 01',palabra:'Auditoría',frase:'Auditoría'},
 {id:'logica',letra:'L',etiqueta:'LETRA 3 · ÁREA 02',palabra:'Lógica',frase:'Lógica'},
 {id:'arquitectura',letra:'A',etiqueta:'LETRA 4 · ÁREA 03',palabra:'Arquitectura',frase:'Arquitectura de Software y Hardware'},
 {id:'software',letra:'S',etiqueta:'LETRA 5 · ÁREA 03',palabra:'Software',frase:'Arquitectura de Software'},
 {id:'hardware',letra:'H',etiqueta:'LETRA 6 · ÁREA 04',palabra:'Hardware',frase:'Arquitectura de Hardware'}
];
