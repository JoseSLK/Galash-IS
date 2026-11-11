import {DOCUMENT} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {Injectable,inject} from '@angular/core';
import {firstValueFrom,timeout} from 'rxjs';
import {API_BASE_URL} from '../config/api.config';

export interface UploadedFile {id:string;name:string;contentType:string;size:number;entityType:string;entityId:string;}
const MAX_SIZE=10*1024*1024;
const MIME:Record<string,string>={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable({providedIn:'root'})
export class FilesService {
 private readonly http=inject(HttpClient);
 private readonly document=inject(DOCUMENT);
 private extension(file:File):string{return file.name.split('.').pop()?.toLowerCase()??'';}
 documentError(file:File):string|null{
  if(!MIME[this.extension(file)])return 'Solo se permiten archivos PDF, Word (.doc, .docx) y Excel (.xls, .xlsx).';
  if(!file.size)return 'El archivo está vacío.';
  if(file.size>MAX_SIZE)return 'El archivo supera el límite de 10 MB.';
  return null;
 }
 async uploadAnnouncement(file:File,announcementId:string):Promise<UploadedFile>{
  const error=this.documentError(file);if(error)throw new Error(error);
  const body=new FormData();body.append('entityType','announcement');body.append('entityId',announcementId);
  // Office files may have an empty or generic browser MIME; the server checks their content.
  body.append('file',file.slice(0,file.size,MIME[this.extension(file)]),file.name);
  return firstValueFrom(this.http.post<UploadedFile>(`${API_BASE_URL}/files`,body,{withCredentials:true}).pipe(timeout(60_000)));
 }
 url(id:string):string{return new URL(`${API_BASE_URL}/files/${encodeURIComponent(id)}`,this.document.baseURI).href;}
 idFromUrl(value:string):string|null{
  try{const base=new URL(`${API_BASE_URL}/files/`,this.document.baseURI),url=new URL(value,this.document.baseURI);
   if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||url.search||url.hash)return null;
   const id=url.pathname.slice(base.pathname.length);return UUID.test(id)?id:null;
  }catch{return null;}
 }
 async download(id:string,name:string):Promise<void>{
  if(!UUID.test(id))throw new Error('Identificador de archivo inválido.');
  const content=await firstValueFrom(this.http.get(`${API_BASE_URL}/files/${encodeURIComponent(id)}`,{responseType:'blob',withCredentials:true}).pipe(timeout(60_000)));
  const url=URL.createObjectURL(content),link=this.document.createElement('a');link.href=url;link.download=name;link.hidden=true;
  this.document.body.appendChild(link);
  try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),10_000);}
 }
}
