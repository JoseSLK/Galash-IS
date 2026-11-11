export interface ContentPage {
 id:string;slug:string;title:string;content:string;status:'borrador'|'publicado';authorId:string;authorName?:string;createdAt:string;updatedAt:string;publishedAt?:string;
}
export type PageInput=Pick<ContentPage,'slug'|'title'|'content'>;
export type LinkCategory='redes-sociales'|'cvlac'|'gruplac'|'minciencias'|'repositorios';
export type LinkStatus='activo'|'inactivo'|'oculto';
export interface OfficialLink {id:string;name:string;description:string;url:string;category:LinkCategory;visible:boolean;order:number;status:LinkStatus;updatedBy?:string;updatedAt:string;createdAt:string;}
export type LinkInput=Pick<OfficialLink,'name'|'description'|'url'|'category'|'visible'|'order'>;
export const LINK_CATEGORIES:readonly {value:LinkCategory;label:string}[]=[{value:'redes-sociales',label:'Redes sociales'},{value:'cvlac',label:'CvLAC'},{value:'gruplac',label:'GrupLAC'},{value:'minciencias',label:'MinCiencias'},{value:'repositorios',label:'Repositorios'}];
export function officialUrl(value:string):string|null {try{const url=new URL(value.trim());return ['https:','http:'].includes(url.protocol)&&!!url.host?url.href:null;}catch{return null;}}
export function publicLink(link:OfficialLink):boolean{return link.status==='activo'&&link.visible&&!!officialUrl(link.url);}
