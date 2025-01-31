import { Component } from "@angular/core";
import { PdfVerifierComponent } from "./pdf-verifier/pdf-verifier.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [PdfVerifierComponent],
  template: "<app-pdf-verifier></app-pdf-verifier>"
})
export class AppComponent {}
