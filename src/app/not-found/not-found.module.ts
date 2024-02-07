import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NOTFOUND_ROUTES } from './not-found.routes';
import { RouterModule } from '@angular/router';
import { ErrorNotFoundComponent } from './pages/error-not-found/error-not-found.component';
import { NotFoundLayoutComponent } from './not-found-layout/not-found-layout.component';

@NgModule({
    declarations: [ErrorNotFoundComponent, NotFoundLayoutComponent],
    imports: [CommonModule, RouterModule.forChild(NOTFOUND_ROUTES)],
})
export class NotfoundModule {}
