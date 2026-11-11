import {Component,inject,signal} from '@angular/core';
import {NonNullableFormBuilder,ReactiveFormsModule,ValidatorFn,Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {AuthService} from '../../core/services/auth.service';
const imageURL:ValidatorFn=control=>{if(!control.value)return null;try{const url=new URL(control.value.trim());return ['http:','https:'].includes(url.protocol)&&url.host?null:{url:true};}catch{return {url:true};}};
@Component({selector:'app-profile-photo-editor',standalone:true,imports:[ReactiveFormsModule],templateUrl:'./profile-photo-editor.component.html',styleUrl:'./profile-photo-editor.component.css'})
export class ProfilePhotoEditorComponent {
 private readonly auth=inject(AuthService);
 private readonly fb=inject(NonNullableFormBuilder);
 readonly saving=signal(false);readonly error=signal('');readonly feedback=signal('');
 readonly form=this.fb.group({photo_url:[this.auth.backendUser()?.photo_url??'',[Validators.required,imageURL,Validators.maxLength(2048)]]});
 async save():Promise<void>{
  this.form.markAllAsTouched();if(this.form.invalid||this.saving())return;
  this.saving.set(true);this.error.set('');this.feedback.set('');
  try{await this.auth.updateOwnPhoto(this.form.getRawValue().photo_url);this.feedback.set('Foto de perfil actualizada.');}
  catch(e){this.error.set(e instanceof HttpErrorResponse&&e.status===401?'Tu sesión venció. Vuelve a iniciar sesión.':'No se pudo guardar la foto. Inténtalo de nuevo.');}
  finally{this.saving.set(false);}
 }
}
