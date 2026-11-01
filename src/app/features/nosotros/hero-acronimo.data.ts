export interface LetraInteractiva { id: string; letra: string; etiqueta: string; palabra: string; frase: string; }
export const LETRAS_GALASH: readonly LetraInteractiva[] = [
 {id:'grupo',letra:'G',etiqueta:'LETRA 1 · GRUPO',palabra:'Grupo',frase:'Grupo de investigación en…'},
 {id:'auditoria',letra:'A',etiqueta:'LETRA 2 · ÁREA 01',palabra:'Auditoría',frase:'[Frase corta sobre el área de auditoría.]'},
 {id:'logica',letra:'L',etiqueta:'LETRA 3 · ÁREA 02',palabra:'Lógica',frase:'[Frase corta sobre el área de lógica.]'},
 {id:'arquitectura',letra:'A',etiqueta:'LETRA 4 · ÁREA 03',palabra:'Arquitectura de',frase:'… de software y de hardware.'},
 {id:'software',letra:'S',etiqueta:'LETRA 5 · ÁREA 03',palabra:'Software',frase:'[Frase corta sobre arquitectura de software.]'},
 {id:'hardware',letra:'H',etiqueta:'LETRA 6 · ÁREA 04',palabra:'Hardware',frase:'[Frase corta sobre arquitectura de hardware.]'}
];
