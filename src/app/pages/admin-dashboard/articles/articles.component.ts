import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule }      from '@angular/common';
import { MatCardModule }     from '@angular/material/card';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatInputModule }    from '@angular/material/input';
import { MatButtonModule }   from '@angular/material/button';
import { MatIconModule }     from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AngularFirestore }  from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { of, forkJoin, Observable }      from 'rxjs';
import { last, switchMap, map } from 'rxjs/operators';
import { ArticleBlockInput, ArticleService } from '../../../services/article.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.scss'
})
export class ArticlesComponent implements OnInit {
  form!: FormGroup;
  previewThumbnail: string|ArrayBuffer|null = null;
  previewBlocks: (string|ArrayBuffer|null)[] = [];
   
  constructor(
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private articleSvc: ArticleService, 
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      thumbnail: [null, Validators.required],
      blocks: this.fb.array([])
    });
    this.addTextBlock();  
  }

  get blocks() { return this.form.get('blocks') as FormArray; }

  addTextBlock() {
    this.blocks.push(this.fb.group({
      type: ['text'],
      text: ['', Validators.required],
      file: [null]
    }));
    this.previewBlocks.push(null);
  }

  addImageBlock() {
    this.blocks.push(this.fb.group({
      type: ['image'],
      text: [''],
      file: [null, Validators.required]
    }));
    this.previewBlocks.push(null);
  }

  removeBlock(i: number) {
    this.blocks.removeAt(i);
    this.previewBlocks.splice(i,1);
  }

  onThumbnailSelected(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/png','image/jpeg'].includes(file.type)) {
      this.snack.open('Thumbnail must be JPEG or PNG','OK',{duration:2000});
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.width>1920 || img.height>1080) {
        this.snack.open('Thumbnail max resolution 1920×1080','OK',{duration:2000});
      } else {
        this.form.patchValue({ thumbnail: file });
        this.previewThumbnail = url;
      }
    };
    img.src = url;
  }

  onBlockFileSelected(ev: Event, idx: number) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!['image/png','image/jpeg'].includes(file.type)) {
      this.snack.open('Images must be JPEG or PNG','OK',{duration:2000});
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.width>1920 || img.height>1080) {
        this.snack.open('Image max resolution 1920×1080','OK',{duration:2000});
      } else {
        this.blocks.at(idx).patchValue({ file });
        this.previewBlocks[idx] = url;
      }
    };
    img.src = url;
  }

  submit() {
    if (this.form.invalid) {
      this.snack.open('Please complete title, thumbnail, and all blocks','OK',{duration:2000});
      return;
    }
    const title     = this.form.value.title;
    const thumbnail = this.form.value.thumbnail as File;
    const blocksRaw = this.form.value.blocks as any[];

    // Map to our input type
    const blocks: ArticleBlockInput[] = blocksRaw.map(b =>
      b.type === 'text'
        ? { type: 'text', text: b.text }
        : { type: 'image', file: b.file }
    );

    this.articleSvc.createArticle(title, thumbnail, blocks).subscribe({
      next: () => {
        this.snack.open('Article created!','OK',{duration:2000});
        this.form.reset();
        this.previewThumbnail = null;
        this.previewBlocks = [];
        this.blocks.clear();
        this.addTextBlock();
      },
      error: err => {
        this.snack.open(`Error: ${err.message}`,'OK',{duration:3000});
      }
    });
  }
}
