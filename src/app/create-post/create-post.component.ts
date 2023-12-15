import { Component } from '@angular/core';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [EditorComponent, MatInputModule],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.css',
})
export class CreatePostComponent {
  public title: string = '';
  public post: string = '';

  public onUpdateTitle(event: any) {
    this.title = event.target.value;
  }

  public onUpdatePost(event: any) {
    console.log(event);
    this.post = btoa(event.event.level.content);
  }

  public handleSubmit() {
    console.log({
      title: this.title,
      post: this.post,
    });
  }
}
