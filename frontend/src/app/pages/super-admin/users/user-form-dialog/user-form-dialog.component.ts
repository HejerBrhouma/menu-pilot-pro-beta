// src/app/pages/super-admin/users/user-form-dialog/user-form-dialog.component.ts

import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { AppUser, ROLES_OPTIONS } from '../../../../core/models/user.model';
import { Establishment } from '../../../../core/models/establishment.model';

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.scss']
})
export class UserFormDialogComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  showPwd = false;
  isEdit: boolean;
  rolesOptions = ROLES_OPTIONS;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      user: AppUser | null;
      establishments: Establishment[];
    }
  ) {
    this.isEdit = !!data.user;
  }

  ngOnInit(): void {
    const u = this.data.user;
    this.form = this.fb.group({
      firstName:     [u?.firstName || '', Validators.required],
      lastName:      [u?.lastName  || ''],
      email:         [u?.email     || '', [Validators.required, Validators.email]],
      password:      ['', this.isEdit ? [] : [Validators.required, Validators.minLength(8)]],
      role:          [u?.roles?.find(r => r !== 'ROLE_USER') || 'ROLE_ADMIN', Validators.required],
      establishment: [u?.establishment || null],
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const { role, password, ...rest } = this.form.value;
    const payload: any = { ...rest, roles: [role] };
    if (!this.isEdit && password) payload.password = password;

    const req$ = this.isEdit
      ? this.userService.update(this.data.user!.id!, payload)
      : this.userService.create(payload);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.message, '✕', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }
}
