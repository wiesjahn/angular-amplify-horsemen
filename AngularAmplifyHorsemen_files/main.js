var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/main.ts
import { bootstrapApplication } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_platform-browser.js?v=bde6b892";

// src/app/app.config.ts
import { provideRouter } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_router.js?v=bde6b892";

// src/app/login/login.component.ts
import { Component } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_core.js?v=bde6b892";
import { AmplifyAuthenticatorModule } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@aws-amplify_ui-angular.js?v=bde6b892";
import * as i0 from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_core.js?v=bde6b892";
import * as i1 from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@aws-amplify_ui-angular.js?v=bde6b892";
function LoginComponent_ng_template_1_Template(rf, ctx) {
}
var _c0 = () => ["google"];
var _LoginComponent = class _LoginComponent {
};
_LoginComponent.\u0275fac = function LoginComponent_Factory(t) {
  return new (t || _LoginComponent)();
};
_LoginComponent.\u0275cmp = /* @__PURE__ */ i0.\u0275\u0275defineComponent({ type: _LoginComponent, selectors: [["app-login"]], standalone: true, features: [i0.\u0275\u0275StandaloneFeature], decls: 2, vars: 2, consts: [[3, "socialProviders"], ["amplifySlot", "authenticated"]], template: function LoginComponent_Template(rf, ctx) {
  if (rf & 1) {
    i0.\u0275\u0275elementStart(0, "amplify-authenticator", 0);
    i0.\u0275\u0275template(1, LoginComponent_ng_template_1_Template, 0, 0, "ng-template", 1);
    i0.\u0275\u0275elementEnd();
  }
  if (rf & 2) {
    i0.\u0275\u0275property("socialProviders", i0.\u0275\u0275pureFunction0(1, _c0));
  }
}, dependencies: [AmplifyAuthenticatorModule, i1.AmplifySlotDirective, i1.AuthenticatorComponent], styles: ["\n\n/*# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFtdLAogICJzb3VyY2VzQ29udGVudCI6IFtdLAogICJtYXBwaW5ncyI6ICIiLAogICJuYW1lcyI6IFtdCn0K */"] });
var LoginComponent = _LoginComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i0.\u0275setClassDebugInfo(LoginComponent, { className: "LoginComponent" });
})();

// src/app/home/home.component.ts
import { Component as Component3 } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_core.js?v=bde6b892";
import { getCurrentUser } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/aws-amplify_auth.js?v=bde6b892";

// src/app/post-list/post-list.component.ts
import { Component as Component2 } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_core.js?v=bde6b892";
import * as i02 from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_core.js?v=bde6b892";
var _PostListComponent = class _PostListComponent {
};
_PostListComponent.\u0275fac = function PostListComponent_Factory(t) {
  return new (t || _PostListComponent)();
};
_PostListComponent.\u0275cmp = /* @__PURE__ */ i02.\u0275\u0275defineComponent({ type: _PostListComponent, selectors: [["app-post-list"]], standalone: true, features: [i02.\u0275\u0275StandaloneFeature], decls: 10, vars: 0, consts: [[1, "post-container"], [1, "card-image"], ["width", "200px", "src", "https://i.natgeofe.com/n/8271db90-5c35-46bc-9429-588a9529e44a/raccoon_thumb_3x4.JPG"], [1, "card-data"], [1, "card-author"], [1, "deck"]], template: function PostListComponent_Template(rf, ctx) {
  if (rf & 1) {
    i02.\u0275\u0275elementStart(0, "div", 0)(1, "div", 1);
    i02.\u0275\u0275element(2, "img", 2);
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(3, "div", 3)(4, "h1");
    i02.\u0275\u0275text(5, "Title of the Song");
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(6, "h3", 4);
    i02.\u0275\u0275text(7, "John Doe on 01/12/23");
    i02.\u0275\u0275elementEnd();
    i02.\u0275\u0275elementStart(8, "div", 5);
    i02.\u0275\u0275text(9, " This dude did something ridiculous! ");
    i02.\u0275\u0275elementEnd()()();
  }
}, styles: ["\n\n.post-container[_ngcontent-%COMP%] {\n  display: flex;\n  align-self: center;\n  flex-direction: row;\n  justify-content: flex-start;\n  width: 1000px;\n}\n.card-data[_ngcontent-%COMP%] {\n  margin-left: 20px;\n  display: flex;\n  flex-direction: column;\n  width: auto;\n  align-items: flex-start;\n}\n.card-title[_ngcontent-%COMP%] {\n  display: flex;\n}\n.card-author[_ngcontent-%COMP%] {\n  margin-bottom: 1%;\n  display: flex;\n}\n/*# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2FwcC9wb3N0LWxpc3QvcG9zdC1saXN0LmNvbXBvbmVudC5jc3MiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi5wb3N0LWNvbnRhaW5lciB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICB3aWR0aDogMTAwMHB4XG59XG5cbi5jYXJkLWRhdGEge1xuICBtYXJnaW4tbGVmdDogMjBweDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgd2lkdGg6IGF1dG87XG4gIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xufVxuXG4uY2FyZC10aXRsZSB7XG4gIGRpc3BsYXk6IGZsZXg7XG59XG5cbi5jYXJkLWF1dGhvciB7XG4gIG1hcmdpbi1ib3R0b206IDElO1xuICBkaXNwbGF5OiBmbGV4O1xufSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxDQUFDO0FBQ0MsV0FBUztBQUNULGNBQVk7QUFDWixrQkFBZ0I7QUFDaEIsbUJBQWlCO0FBQ2pCLFNBQU87QUFDVDtBQUVBLENBQUM7QUFDQyxlQUFhO0FBQ2IsV0FBUztBQUNULGtCQUFnQjtBQUNoQixTQUFPO0FBQ1AsZUFBYTtBQUNmO0FBRUEsQ0FBQztBQUNDLFdBQVM7QUFDWDtBQUVBLENBQUM7QUFDQyxpQkFBZTtBQUNmLFdBQVM7QUFDWDsiLAogICJuYW1lcyI6IFtdCn0K */"] });
var PostListComponent = _PostListComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i02.\u0275setClassDebugInfo(PostListComponent, { className: "PostListComponent" });
})();

// src/app/home/home.component.ts
import * as i03 from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_core.js?v=bde6b892";
var _HomeComponent = class _HomeComponent {
  getCurrentUser() {
    return __async(this, null, function* () {
      this.isLoggedIn = yield getCurrentUser();
      console.log(yield getCurrentUser());
    });
  }
};
_HomeComponent.\u0275fac = function HomeComponent_Factory(t) {
  return new (t || _HomeComponent)();
};
_HomeComponent.\u0275cmp = /* @__PURE__ */ i03.\u0275\u0275defineComponent({ type: _HomeComponent, selectors: [["app-home"]], standalone: true, features: [i03.\u0275\u0275StandaloneFeature], decls: 2, vars: 0, consts: [[1, "container"]], template: function HomeComponent_Template(rf, ctx) {
  if (rf & 1) {
    i03.\u0275\u0275elementStart(0, "div", 0);
    i03.\u0275\u0275element(1, "app-post-list");
    i03.\u0275\u0275elementEnd();
  }
}, dependencies: [PostListComponent], styles: ["\n\n.container[_ngcontent-%COMP%] {\n  margin-top: 20px;\n  display: flex;\n  justify-content: center;\n  align-self: center;\n}\n/*# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2FwcC9ob21lL2hvbWUuY29tcG9uZW50LmNzcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLmNvbnRhaW5lciB7XG4gIG1hcmdpbi10b3A6IDIwcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBhbGlnbi1zZWxmOiBjZW50ZXI7XG59Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLENBQUM7QUFDQyxjQUFZO0FBQ1osV0FBUztBQUNULG1CQUFpQjtBQUNqQixjQUFZO0FBQ2Q7IiwKICAibmFtZXMiOiBbXQp9Cg== */"] });
var HomeComponent = _HomeComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i03.\u0275setClassDebugInfo(HomeComponent, { className: "HomeComponent" });
})();

// src/app/create-post/create-post.component.ts
import { Component as Component4 } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_core.js?v=bde6b892";
import { EditorComponent } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@tinymce_tinymce-angular.js?v=bde6b892";
import { MatInputModule } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_material_input.js?v=bde6b892";
import * as i04 from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_core.js?v=bde6b892";
import * as i12 from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_material_input.js?v=bde6b892";
import * as i2 from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_material_form-field.js?v=bde6b892";
var _c02 = "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount";
var _c1 = "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat";
var _c2 = () => ({ plugins: _c02, toolbar: _c1 });
var _CreatePostComponent = class _CreatePostComponent {
  constructor() {
    this.title = "";
    this.post = "";
  }
  onUpdateTitle(event) {
    this.title = event.target.value;
  }
  onUpdatePost(event) {
    console.log(event);
    this.post = btoa(event.event.level.content);
  }
  handleSubmit() {
    console.log({
      title: this.title,
      post: this.post
    });
  }
};
_CreatePostComponent.\u0275fac = function CreatePostComponent_Factory(t) {
  return new (t || _CreatePostComponent)();
};
_CreatePostComponent.\u0275cmp = /* @__PURE__ */ i04.\u0275\u0275defineComponent({ type: _CreatePostComponent, selectors: [["app-create-post"]], standalone: true, features: [i04.\u0275\u0275StandaloneFeature], decls: 10, vars: 2, consts: [[2, "margin", "25px"], [1, "full-width"], ["matInput", "", 3, "change"], ["apiKey", "sspdjpecte925lcf3rt5ubbotd9055tsppbflbfw2vfqlyqe", 3, "init", "onChange"], [3, "click"]], template: function CreatePostComponent_Template(rf, ctx) {
  if (rf & 1) {
    i04.\u0275\u0275elementStart(0, "div", 0)(1, "h1");
    i04.\u0275\u0275text(2, "Create Post");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(3, "mat-form-field", 1)(4, "mat-label");
    i04.\u0275\u0275text(5, "Title");
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(6, "input", 2);
    i04.\u0275\u0275listener("change", function CreatePostComponent_Template_input_change_6_listener($event) {
      return ctx.onUpdateTitle($event);
    });
    i04.\u0275\u0275elementEnd()();
    i04.\u0275\u0275elementStart(7, "editor", 3);
    i04.\u0275\u0275listener("onChange", function CreatePostComponent_Template_editor_onChange_7_listener($event) {
      return ctx.onUpdatePost($event);
    });
    i04.\u0275\u0275elementEnd();
    i04.\u0275\u0275elementStart(8, "button", 4);
    i04.\u0275\u0275listener("click", function CreatePostComponent_Template_button_click_8_listener() {
      return ctx.handleSubmit();
    });
    i04.\u0275\u0275text(9, "Submit");
    i04.\u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    i04.\u0275\u0275advance(7);
    i04.\u0275\u0275property("init", i04.\u0275\u0275pureFunction0(1, _c2));
  }
}, dependencies: [EditorComponent, MatInputModule, i12.MatInput, i2.MatFormField, i2.MatLabel], styles: ["\n\n.full-width[_ngcontent-%COMP%] {\n  width: 100%;\n}\n/*# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2FwcC9jcmVhdGUtcG9zdC9jcmVhdGUtcG9zdC5jb21wb25lbnQuY3NzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIuZnVsbC13aWR0aCB7XG4gIHdpZHRoOiAxMDAlO1xufSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQSxDQUFDO0FBQ0MsU0FBTztBQUNUOyIsCiAgIm5hbWVzIjogW10KfQo= */"] });
var CreatePostComponent = _CreatePostComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i04.\u0275setClassDebugInfo(CreatePostComponent, { className: "CreatePostComponent" });
})();

// src/app/app.routes.ts
var routes = [
  { path: "login", component: LoginComponent },
  { path: "home", component: HomeComponent },
  { path: "create", component: CreatePostComponent }
];

// src/app/app.config.ts
import { provideAnimations } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_platform-browser_animations.js?v=bde6b892";
var appConfig = {
  providers: [provideRouter(routes), provideAnimations()]
};

// src/app/app.component.ts
import { Component as Component5 } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_core.js?v=bde6b892";
import { CommonModule } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_common.js?v=bde6b892";
import { RouterOutlet, RouterLink, RouterLinkActive } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_router.js?v=bde6b892";
import { MatToolbarModule } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_material_toolbar.js?v=bde6b892";
import { MatButtonModule } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_material_button.js?v=bde6b892";
import { AmplifyAuthenticatorModule as AmplifyAuthenticatorModule2 } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@aws-amplify_ui-angular.js?v=bde6b892";
import { fetchAuthSession, signOut } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/aws-amplify_auth.js?v=bde6b892";
import * as i05 from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_core.js?v=bde6b892";
import * as i13 from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_common.js?v=bde6b892";
import * as i22 from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/@angular_material_toolbar.js?v=bde6b892";
function AppComponent_ng_container_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = i05.\u0275\u0275getCurrentView();
    i05.\u0275\u0275elementContainerStart(0);
    i05.\u0275\u0275elementStart(1, "a", 3);
    i05.\u0275\u0275listener("click", function AppComponent_ng_container_6_Template_a_click_1_listener() {
      i05.\u0275\u0275restoreView(_r3);
      const ctx_r2 = i05.\u0275\u0275nextContext();
      return i05.\u0275\u0275resetView(ctx_r2.handleSignOut());
    });
    i05.\u0275\u0275text(2, "Logout");
    i05.\u0275\u0275elementEnd();
    i05.\u0275\u0275elementContainerEnd();
  }
}
var _c03 = () => ["/login"];
function AppComponent_ng_container_7_Template(rf, ctx) {
  if (rf & 1) {
    i05.\u0275\u0275elementContainerStart(0);
    i05.\u0275\u0275elementStart(1, "a", 4);
    i05.\u0275\u0275text(2, "Login");
    i05.\u0275\u0275elementEnd();
    i05.\u0275\u0275elementContainerEnd();
  }
  if (rf & 2) {
    i05.\u0275\u0275advance(1);
    i05.\u0275\u0275property("routerLink", i05.\u0275\u0275pureFunction0(1, _c03));
  }
}
var _AppComponent = class _AppComponent {
  constructor() {
    this.isLoggedIn = false;
    this.title = "angular-amplify-horsemen";
  }
  getCurrentSession() {
    return __async(this, null, function* () {
      try {
        const { accessToken, idToken } = (yield fetchAuthSession()).tokens ?? {};
        this.accessToken = accessToken;
        this.idToken = idToken;
        console.log({ accessToken, idToken });
      } catch (err) {
        console.log(err);
      }
    });
  }
  getIsLoggedIn() {
    return __async(this, null, function* () {
      try {
        const { accessToken } = (yield fetchAuthSession()).tokens ?? {};
        if (accessToken) {
          this.isLoggedIn = true;
        }
      } catch (err) {
        console.log(err);
      }
    });
  }
  handleSignOut() {
    return __async(this, null, function* () {
      try {
        yield signOut();
        this.isLoggedIn = false;
      } catch (err) {
        console.log(err);
      }
    });
  }
  ngOnInit() {
    return __async(this, null, function* () {
      yield this.getCurrentSession();
      yield this.getIsLoggedIn();
      console.log(this.isLoggedIn);
    });
  }
};
_AppComponent.\u0275fac = function AppComponent_Factory(t) {
  return new (t || _AppComponent)();
};
_AppComponent.\u0275cmp = /* @__PURE__ */ i05.\u0275\u0275defineComponent({ type: _AppComponent, selectors: [["app-root"]], standalone: true, features: [i05.\u0275\u0275StandaloneFeature], decls: 9, vars: 2, consts: [[1, "menu-spacer"], [1, "button", 2, "margin-right", "10px", 3, "click"], [4, "ngIf"], [1, "button", 3, "click"], ["routerLinkActive", "router-link-active", 1, "button", 3, "routerLink"]], template: function AppComponent_Template(rf, ctx) {
  if (rf & 1) {
    i05.\u0275\u0275elementStart(0, "mat-toolbar")(1, "h1");
    i05.\u0275\u0275text(2, "The Ten Horsemen");
    i05.\u0275\u0275elementEnd();
    i05.\u0275\u0275element(3, "span", 0);
    i05.\u0275\u0275elementStart(4, "button", 1);
    i05.\u0275\u0275listener("click", function AppComponent_Template_button_click_4_listener() {
      return ctx.getCurrentSession();
    });
    i05.\u0275\u0275text(5, "Get Session");
    i05.\u0275\u0275elementEnd();
    i05.\u0275\u0275template(6, AppComponent_ng_container_6_Template, 3, 0, "ng-container", 2)(7, AppComponent_ng_container_7_Template, 3, 2, "ng-container", 2);
    i05.\u0275\u0275elementEnd();
    i05.\u0275\u0275element(8, "router-outlet");
  }
  if (rf & 2) {
    i05.\u0275\u0275advance(6);
    i05.\u0275\u0275property("ngIf", ctx.isLoggedIn);
    i05.\u0275\u0275advance(1);
    i05.\u0275\u0275property("ngIf", !ctx.isLoggedIn);
  }
}, dependencies: [
  CommonModule,
  i13.NgIf,
  MatToolbarModule,
  i22.MatToolbar,
  MatButtonModule,
  AmplifyAuthenticatorModule2,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
], styles: ['\n\n.container[_ngcontent-%COMP%] {\n  background-color: "red";\n  width: 100%;\n  height: 100%;\n}\n.menu-spacer[_ngcontent-%COMP%] {\n  flex: 1 1 auto;\n}\n.button[_ngcontent-%COMP%] {\n  box-shadow: inset 0 1px 0 0 #ffffff;\n  background: #ffffff linear-gradient(to bottom, #ffffff 5%, #f6f6f6 100%);\n  border-radius: 6px;\n  border: 1px solid #dcdcdc;\n  display: inline-block;\n  cursor: pointer;\n  color: #666666;\n  font-family: Arial, sans-serif;\n  font-size: 15px;\n  font-weight: bold;\n  padding: 6px 24px;\n  text-decoration: none;\n  text-shadow: 0 1px 0 #ffffff;\n  outline: 0;\n}\n.activebutton[_ngcontent-%COMP%] {\n  box-shadow: inset 0 1px 0 0 #dcecfb;\n  background: #bddbfa linear-gradient(to bottom, #bddbfa 5%, #80b5ea 100%);\n  border: 1px solid #84bbf3;\n  color: #ffffff;\n  text-shadow: 0 1px 0 #528ecc;\n}\n/*# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL2FwcC9hcHAuY29tcG9uZW50LmNzcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLmNvbnRhaW5lciB7XG4gIGJhY2tncm91bmQtY29sb3I6ICdyZWQnO1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiAxMDAlO1xufVxuXG4ubWVudS1zcGFjZXIge1xuICBmbGV4OiAxIDEgYXV0bztcbn1cblxuLmJ1dHRvbiB7XG4gIGJveC1zaGFkb3c6IGluc2V0IDAgMXB4IDAgMCAjZmZmZmZmO1xuICBiYWNrZ3JvdW5kOiAjZmZmZmZmIGxpbmVhci1ncmFkaWVudCh0byBib3R0b20sICNmZmZmZmYgNSUsICNmNmY2ZjYgMTAwJSk7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgYm9yZGVyOiAxcHggc29saWQgI2RjZGNkYztcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGNvbG9yOiAjNjY2NjY2O1xuICBmb250LWZhbWlseTogQXJpYWwsIHNhbnMtc2VyaWY7XG4gIGZvbnQtc2l6ZTogMTVweDtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIHBhZGRpbmc6IDZweCAyNHB4O1xuICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gIHRleHQtc2hhZG93OiAwIDFweCAwICNmZmZmZmY7XG4gIG91dGxpbmU6IDA7XG59XG5cbi5hY3RpdmVidXR0b24ge1xuICBib3gtc2hhZG93OiBpbnNldCAwIDFweCAwIDAgI2RjZWNmYjtcbiAgYmFja2dyb3VuZDogI2JkZGJmYSBsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAjYmRkYmZhIDUlLCAjODBiNWVhIDEwMCUpO1xuICBib3JkZXI6IDFweCBzb2xpZCAjODRiYmYzO1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgdGV4dC1zaGFkb3c6IDAgMXB4IDAgIzUyOGVjYztcbn0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsQ0FBQztBQUNDLG9CQUFrQjtBQUNsQixTQUFPO0FBQ1AsVUFBUTtBQUNWO0FBRUEsQ0FBQztBQUNDLFFBQU0sRUFBRSxFQUFFO0FBQ1o7QUFFQSxDQUFDO0FBQ0MsY0FBWSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUU7QUFDNUIsY0FBWSxRQUFRLGdCQUFnQixHQUFHLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRSxRQUFRO0FBQ25FLGlCQUFlO0FBQ2YsVUFBUSxJQUFJLE1BQU07QUFDbEIsV0FBUztBQUNULFVBQVE7QUFDUixTQUFPO0FBQ1AsZUFBYSxLQUFLLEVBQUU7QUFDcEIsYUFBVztBQUNYLGVBQWE7QUFDYixXQUFTLElBQUk7QUFDYixtQkFBaUI7QUFDakIsZUFBYSxFQUFFLElBQUksRUFBRTtBQUNyQixXQUFTO0FBQ1g7QUFFQSxDQUFDO0FBQ0MsY0FBWSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUU7QUFDNUIsY0FBWSxRQUFRLGdCQUFnQixHQUFHLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRSxRQUFRO0FBQ25FLFVBQVEsSUFBSSxNQUFNO0FBQ2xCLFNBQU87QUFDUCxlQUFhLEVBQUUsSUFBSSxFQUFFO0FBQ3ZCOyIsCiAgIm5hbWVzIjogW10KfQo= */'] });
var AppComponent = _AppComponent;
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && i05.\u0275setClassDebugInfo(AppComponent, { className: "AppComponent" });
})();

// src/main.ts
import { Amplify } from "/@fs/Users/nick.wiesjahn/Dev/personal/angular-amplify-horsemen/.angular/cache/17.0.7/vite/deps/aws-amplify.js?v=bde6b892";

// src/amplifyconfiguration.json
var amplifyconfiguration_exports = {};
__export(amplifyconfiguration_exports, {
  aws_appsync_apiKey: () => aws_appsync_apiKey,
  aws_appsync_authenticationType: () => aws_appsync_authenticationType,
  aws_appsync_graphqlEndpoint: () => aws_appsync_graphqlEndpoint,
  aws_appsync_region: () => aws_appsync_region,
  aws_cognito_identity_pool_id: () => aws_cognito_identity_pool_id,
  aws_cognito_mfa_configuration: () => aws_cognito_mfa_configuration,
  aws_cognito_mfa_types: () => aws_cognito_mfa_types,
  aws_cognito_password_protection_settings: () => aws_cognito_password_protection_settings,
  aws_cognito_region: () => aws_cognito_region,
  aws_cognito_signup_attributes: () => aws_cognito_signup_attributes,
  aws_cognito_social_providers: () => aws_cognito_social_providers,
  aws_cognito_username_attributes: () => aws_cognito_username_attributes,
  aws_cognito_verification_mechanisms: () => aws_cognito_verification_mechanisms,
  aws_project_region: () => aws_project_region,
  aws_user_pools_id: () => aws_user_pools_id,
  aws_user_pools_web_client_id: () => aws_user_pools_web_client_id,
  default: () => amplifyconfiguration_default,
  federationTarget: () => federationTarget,
  oauth: () => oauth
});
var aws_project_region = "us-east-1";
var aws_appsync_graphqlEndpoint = "https://p5iumqnsuvfr5kbxebepwi6klu.appsync-api.us-east-1.amazonaws.com/graphql";
var aws_appsync_region = "us-east-1";
var aws_appsync_authenticationType = "API_KEY";
var aws_appsync_apiKey = "da2-cmzmfnibqfg7nl3umbalaubedq";
var aws_cognito_identity_pool_id = "us-east-1:1ca33259-70f6-4e19-bf2a-95e8e7a6ba9f";
var aws_cognito_region = "us-east-1";
var aws_user_pools_id = "us-east-1_977iphL7s";
var aws_user_pools_web_client_id = "7f5ora06btgij4o62404ikha3r";
var oauth = {
  domain: "angularamplifyhorsem8acd48f4-8acd48f4-dev.auth.us-east-1.amazoncognito.com",
  scope: [
    "phone",
    "email",
    "openid",
    "profile",
    "aws.cognito.signin.user.admin"
  ],
  redirectSignIn: "http://localhost:4200/home/",
  redirectSignOut: "http://localhost:4200/login/",
  responseType: "code"
};
var federationTarget = "COGNITO_USER_POOLS";
var aws_cognito_username_attributes = [
  "EMAIL"
];
var aws_cognito_social_providers = [
  "GOOGLE"
];
var aws_cognito_signup_attributes = [
  "EMAIL"
];
var aws_cognito_mfa_configuration = "OFF";
var aws_cognito_mfa_types = [
  "SMS"
];
var aws_cognito_password_protection_settings = {
  passwordPolicyMinLength: 8,
  passwordPolicyCharacters: []
};
var aws_cognito_verification_mechanisms = [
  "EMAIL"
];
var amplifyconfiguration_default = {
  aws_project_region,
  aws_appsync_graphqlEndpoint,
  aws_appsync_region,
  aws_appsync_authenticationType,
  aws_appsync_apiKey,
  aws_cognito_identity_pool_id,
  aws_cognito_region,
  aws_user_pools_id,
  aws_user_pools_web_client_id,
  oauth,
  federationTarget,
  aws_cognito_username_attributes,
  aws_cognito_social_providers,
  aws_cognito_signup_attributes,
  aws_cognito_mfa_configuration,
  aws_cognito_mfa_types,
  aws_cognito_password_protection_settings,
  aws_cognito_verification_mechanisms
};

// src/main.ts
Amplify.configure(amplifyconfiguration_exports);
bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9tYWluLnRzIiwic3JjL2FwcC9hcHAuY29uZmlnLnRzIiwic3JjL2FwcC9sb2dpbi9sb2dpbi5jb21wb25lbnQudHMiLCJzcmMvYXBwL2xvZ2luL2xvZ2luLmNvbXBvbmVudC5odG1sIiwic3JjL2FwcC9ob21lL2hvbWUuY29tcG9uZW50LnRzIiwic3JjL2FwcC9ob21lL2hvbWUuY29tcG9uZW50Lmh0bWwiLCJzcmMvYXBwL3Bvc3QtbGlzdC9wb3N0LWxpc3QuY29tcG9uZW50LnRzIiwic3JjL2FwcC9wb3N0LWxpc3QvcG9zdC1saXN0LmNvbXBvbmVudC5odG1sIiwic3JjL2FwcC9jcmVhdGUtcG9zdC9jcmVhdGUtcG9zdC5jb21wb25lbnQudHMiLCJzcmMvYXBwL2NyZWF0ZS1wb3N0L2NyZWF0ZS1wb3N0LmNvbXBvbmVudC5odG1sIiwic3JjL2FwcC9hcHAucm91dGVzLnRzIiwic3JjL2FwcC9hcHAuY29tcG9uZW50LnRzIiwic3JjL2FwcC9hcHAuY29tcG9uZW50Lmh0bWwiLCJzcmMvYW1wbGlmeWNvbmZpZ3VyYXRpb24uanNvbiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBib290c3RyYXBBcHBsaWNhdGlvbiB9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXInO1xuaW1wb3J0IHsgYXBwQ29uZmlnIH0gZnJvbSAnLi9hcHAvYXBwLmNvbmZpZyc7XG5pbXBvcnQgeyBBcHBDb21wb25lbnQgfSBmcm9tICcuL2FwcC9hcHAuY29tcG9uZW50JztcbmltcG9ydCB7IEFtcGxpZnkgfSBmcm9tICdhd3MtYW1wbGlmeSc7XG5pbXBvcnQgKiBhcyBjb25maWcgZnJvbSAnLi9hbXBsaWZ5Y29uZmlndXJhdGlvbi5qc29uJztcbkFtcGxpZnkuY29uZmlndXJlKGNvbmZpZyk7XG5cbmJvb3RzdHJhcEFwcGxpY2F0aW9uKEFwcENvbXBvbmVudCwgYXBwQ29uZmlnKVxuICAuY2F0Y2goKGVycikgPT4gY29uc29sZS5lcnJvcihlcnIpKTtcbiIsImltcG9ydCB7IEFwcGxpY2F0aW9uQ29uZmlnIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBwcm92aWRlUm91dGVyIH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IHJvdXRlcyB9IGZyb20gJy4vYXBwLnJvdXRlcyc7XG5pbXBvcnQgeyBwcm92aWRlQW5pbWF0aW9ucyB9IGZyb20gJ0Bhbmd1bGFyL3BsYXRmb3JtLWJyb3dzZXIvYW5pbWF0aW9ucyc7XG5cbmV4cG9ydCBjb25zdCBhcHBDb25maWc6IEFwcGxpY2F0aW9uQ29uZmlnID0ge1xuICBwcm92aWRlcnM6IFtwcm92aWRlUm91dGVyKHJvdXRlcyksIHByb3ZpZGVBbmltYXRpb25zKCldLFxufTtcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQW1wbGlmeUF1dGhlbnRpY2F0b3JNb2R1bGUgfSBmcm9tICdAYXdzLWFtcGxpZnkvdWktYW5ndWxhcic7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ2FwcC1sb2dpbicsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGltcG9ydHM6IFtBbXBsaWZ5QXV0aGVudGljYXRvck1vZHVsZV0sXG4gIHRlbXBsYXRlVXJsOiAnLi9sb2dpbi5jb21wb25lbnQuaHRtbCcsXG4gIHN0eWxlVXJsOiAnLi9sb2dpbi5jb21wb25lbnQuY3NzJyxcbn0pXG5leHBvcnQgY2xhc3MgTG9naW5Db21wb25lbnQge31cbiIsIjxhbXBsaWZ5LWF1dGhlbnRpY2F0b3IgW3NvY2lhbFByb3ZpZGVyc109XCJbJ2dvb2dsZSddXCI+XG4gIDxuZy10ZW1wbGF0ZSBhbXBsaWZ5U2xvdD1cImF1dGhlbnRpY2F0ZWRcIiBsZXQtdXNlcj1cInVzZXJcIiBsZXQtc2lnbk91dD1cInNpZ25PdXRcIj5cbiAgPC9uZy10ZW1wbGF0ZT5cbjwvYW1wbGlmeS1hdXRoZW50aWNhdG9yPiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgZ2V0Q3VycmVudFVzZXIgfSBmcm9tICdhd3MtYW1wbGlmeS9hdXRoJztcbmltcG9ydCB7IFBvc3RMaXN0Q29tcG9uZW50IH0gZnJvbSAnLi4vcG9zdC1saXN0L3Bvc3QtbGlzdC5jb21wb25lbnQnO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdhcHAtaG9tZScsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGltcG9ydHM6IFtQb3N0TGlzdENvbXBvbmVudF0sXG4gIHRlbXBsYXRlVXJsOiAnLi9ob21lLmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmw6ICcuL2hvbWUuY29tcG9uZW50LmNzcycsXG59KVxuZXhwb3J0IGNsYXNzIEhvbWVDb21wb25lbnQge1xuICBwdWJsaWMgaXNMb2dnZWRJbjogYW55O1xuXG4gIHB1YmxpYyBhY2Nlc3NUb2tlbjogYW55O1xuICBwdWJsaWMgaWRUb2tlbjogYW55O1xuXG4gIGFzeW5jIGdldEN1cnJlbnRVc2VyKCkge1xuICAgIHRoaXMuaXNMb2dnZWRJbiA9IGF3YWl0IGdldEN1cnJlbnRVc2VyKCk7XG4gICAgY29uc29sZS5sb2coYXdhaXQgZ2V0Q3VycmVudFVzZXIoKSk7XG4gIH1cbn1cblxuXG4iLCI8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCI+XG4gIDxhcHAtcG9zdC1saXN0PjwvYXBwLXBvc3QtbGlzdD5cbjwvZGl2PiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdhcHAtcG9zdC1saXN0JyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaW1wb3J0czogW10sXG4gIHRlbXBsYXRlVXJsOiAnLi9wb3N0LWxpc3QuY29tcG9uZW50Lmh0bWwnLFxuICBzdHlsZVVybDogJy4vcG9zdC1saXN0LmNvbXBvbmVudC5jc3MnXG59KVxuZXhwb3J0IGNsYXNzIFBvc3RMaXN0Q29tcG9uZW50IHtcblxufVxuIiwiPGRpdiBjbGFzcz1cInBvc3QtY29udGFpbmVyXCI+XG5cbiAgPGRpdiBjbGFzcz1cImNhcmQtaW1hZ2VcIj5cbiAgICA8aW1nIHdpZHRoPScyMDBweCcgc3JjPVwiaHR0cHM6Ly9pLm5hdGdlb2ZlLmNvbS9uLzgyNzFkYjkwLTVjMzUtNDZiYy05NDI5LTU4OGE5NTI5ZTQ0YS9yYWNjb29uX3RodW1iXzN4NC5KUEdcIiAvPlxuICA8L2Rpdj5cblxuICA8ZGl2IGNsYXNzPVwiY2FyZC1kYXRhXCI+XG4gICAgPGgxPlRpdGxlIG9mIHRoZSBTb25nPC9oMT5cbiAgICA8aDMgY2xhc3M9XCJjYXJkLWF1dGhvclwiPkpvaG4gRG9lIG9uIDAxLzEyLzIzPC9oMz5cbiAgICA8ZGl2IGNsYXNzPVwiZGVja1wiPlxuICAgICAgVGhpcyBkdWRlIGRpZCBzb21ldGhpbmcgcmlkaWN1bG91cyFcbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG5cblxuXG48L2Rpdj4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEVkaXRvckNvbXBvbmVudCB9IGZyb20gJ0B0aW55bWNlL3RpbnltY2UtYW5ndWxhcic7XG5pbXBvcnQgeyBNYXRJbnB1dE1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL21hdGVyaWFsL2lucHV0JztcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAnYXBwLWNyZWF0ZS1wb3N0JyxcbiAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAgaW1wb3J0czogW0VkaXRvckNvbXBvbmVudCwgTWF0SW5wdXRNb2R1bGVdLFxuICB0ZW1wbGF0ZVVybDogJy4vY3JlYXRlLXBvc3QuY29tcG9uZW50Lmh0bWwnLFxuICBzdHlsZVVybDogJy4vY3JlYXRlLXBvc3QuY29tcG9uZW50LmNzcycsXG59KVxuZXhwb3J0IGNsYXNzIENyZWF0ZVBvc3RDb21wb25lbnQge1xuICBwdWJsaWMgdGl0bGU6IHN0cmluZyA9ICcnO1xuICBwdWJsaWMgcG9zdDogc3RyaW5nID0gJyc7XG5cbiAgcHVibGljIG9uVXBkYXRlVGl0bGUoZXZlbnQ6IGFueSkge1xuICAgIHRoaXMudGl0bGUgPSBldmVudC50YXJnZXQudmFsdWU7XG4gIH1cblxuICBwdWJsaWMgb25VcGRhdGVQb3N0KGV2ZW50OiBhbnkpIHtcbiAgICBjb25zb2xlLmxvZyhldmVudCk7XG4gICAgdGhpcy5wb3N0ID0gYnRvYShldmVudC5ldmVudC5sZXZlbC5jb250ZW50KTtcbiAgfVxuXG4gIHB1YmxpYyBoYW5kbGVTdWJtaXQoKSB7XG4gICAgY29uc29sZS5sb2coe1xuICAgICAgdGl0bGU6IHRoaXMudGl0bGUsXG4gICAgICBwb3N0OiB0aGlzLnBvc3QsXG4gICAgfSk7XG4gIH1cbn1cbiIsIjxkaXYgc3R5bGU9XCJtYXJnaW46IDI1cHhcIj5cbiAgPGgxPkNyZWF0ZSBQb3N0PC9oMT5cbiAgPG1hdC1mb3JtLWZpZWxkIGNsYXNzPVwiZnVsbC13aWR0aFwiPlxuICAgIDxtYXQtbGFiZWw+VGl0bGU8L21hdC1sYWJlbD5cbiAgICA8aW5wdXQgbWF0SW5wdXQgKGNoYW5nZSk9XCJvblVwZGF0ZVRpdGxlKCRldmVudClcIiAvPlxuICA8L21hdC1mb3JtLWZpZWxkPlxuICA8ZWRpdG9yIGFwaUtleT1cInNzcGRqcGVjdGU5MjVsY2YzcnQ1dWJib3RkOTA1NXRzcHBiZmxiZncydmZxbHlxZVwiIFtpbml0XT1cIntcbiAgICBwbHVnaW5zOiAnYW5jaG9yIGF1dG9saW5rIGNoYXJtYXAgY29kZXNhbXBsZSBlbW90aWNvbnMgaW1hZ2UgbGluayBsaXN0cyBtZWRpYSBzZWFyY2hyZXBsYWNlIHRhYmxlIHZpc3VhbGJsb2NrcyB3b3JkY291bnQnLFxuICAgIHRvb2xiYXI6ICd1bmRvIHJlZG8gfCBibG9ja3MgZm9udGZhbWlseSBmb250c2l6ZSB8IGJvbGQgaXRhbGljIHVuZGVybGluZSBzdHJpa2V0aHJvdWdoIHwgbGluayBpbWFnZSBtZWRpYSB0YWJsZSB8IGFsaWduIGxpbmVoZWlnaHQgfCBudW1saXN0IGJ1bGxpc3QgaW5kZW50IG91dGRlbnQgfCBlbW90aWNvbnMgY2hhcm1hcCB8IHJlbW92ZWZvcm1hdCcsXG4gIH1cIiAob25DaGFuZ2UpPVwib25VcGRhdGVQb3N0KCRldmVudClcIj48L2VkaXRvcj5cbiAgPGJ1dHRvbiAoY2xpY2spPVwiaGFuZGxlU3VibWl0KClcIj5TdWJtaXQ8L2J1dHRvbj5cbjwvZGl2PiIsImltcG9ydCB7IFJvdXRlcyB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBMb2dpbkNvbXBvbmVudCB9IGZyb20gJy4vbG9naW4vbG9naW4uY29tcG9uZW50JztcbmltcG9ydCB7IEhvbWVDb21wb25lbnQgfSBmcm9tICcuL2hvbWUvaG9tZS5jb21wb25lbnQnO1xuaW1wb3J0IHsgQ3JlYXRlUG9zdENvbXBvbmVudCB9IGZyb20gJy4vY3JlYXRlLXBvc3QvY3JlYXRlLXBvc3QuY29tcG9uZW50JztcblxuZXhwb3J0IGNvbnN0IHJvdXRlczogUm91dGVzID0gW1xuICB7IHBhdGg6ICdsb2dpbicsIGNvbXBvbmVudDogTG9naW5Db21wb25lbnQgfSxcbiAgeyBwYXRoOiAnaG9tZScsIGNvbXBvbmVudDogSG9tZUNvbXBvbmVudCB9LFxuICB7IHBhdGg6ICdjcmVhdGUnLCBjb21wb25lbnQ6IENyZWF0ZVBvc3RDb21wb25lbnQgfSxcbl07XG4iLCJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7IFJvdXRlck91dGxldCwgUm91dGVyTGluaywgUm91dGVyTGlua0FjdGl2ZSB9IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBNYXRUb29sYmFyTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvbWF0ZXJpYWwvdG9vbGJhcic7XG5pbXBvcnQgeyBNYXRCdXR0b25Nb2R1bGUgfSBmcm9tICdAYW5ndWxhci9tYXRlcmlhbC9idXR0b24nO1xuaW1wb3J0IHsgQW1wbGlmeUF1dGhlbnRpY2F0b3JNb2R1bGUgfSBmcm9tICdAYXdzLWFtcGxpZnkvdWktYW5ndWxhcic7XG5pbXBvcnQgeyBMb2dpbkNvbXBvbmVudCB9IGZyb20gJy4vbG9naW4vbG9naW4uY29tcG9uZW50JztcbmltcG9ydCB7IEhvbWVDb21wb25lbnQgfSBmcm9tICcuL2hvbWUvaG9tZS5jb21wb25lbnQnO1xuaW1wb3J0IHsgZmV0Y2hBdXRoU2Vzc2lvbiwgc2lnbk91dCB9IGZyb20gJ2F3cy1hbXBsaWZ5L2F1dGgnO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdhcHAtcm9vdCcsXG4gIHN0YW5kYWxvbmU6IHRydWUsXG4gIGltcG9ydHM6IFtcbiAgICBDb21tb25Nb2R1bGUsXG4gICAgTWF0VG9vbGJhck1vZHVsZSxcbiAgICBNYXRCdXR0b25Nb2R1bGUsXG4gICAgQW1wbGlmeUF1dGhlbnRpY2F0b3JNb2R1bGUsXG4gICAgUm91dGVyTGluayxcbiAgICBSb3V0ZXJMaW5rQWN0aXZlLFxuICAgIFJvdXRlck91dGxldCxcbiAgICBMb2dpbkNvbXBvbmVudCxcbiAgICBIb21lQ29tcG9uZW50LFxuICBdLFxuICB0ZW1wbGF0ZVVybDogJy4vYXBwLmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmw6ICcuL2FwcC5jb21wb25lbnQuY3NzJyxcbn0pXG5leHBvcnQgY2xhc3MgQXBwQ29tcG9uZW50IHtcbiAgcHVibGljIGFjY2Vzc1Rva2VuOiBhbnk7XG4gIHB1YmxpYyBpZFRva2VuOiBhbnk7XG5cbiAgcHVibGljIGlzTG9nZ2VkSW46IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcigpIHt9XG5cbiAgYXN5bmMgZ2V0Q3VycmVudFNlc3Npb24oKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHsgYWNjZXNzVG9rZW4sIGlkVG9rZW4gfSA9IChhd2FpdCBmZXRjaEF1dGhTZXNzaW9uKCkpLnRva2VucyA/PyB7fTtcbiAgICAgIHRoaXMuYWNjZXNzVG9rZW4gPSBhY2Nlc3NUb2tlbjtcbiAgICAgIHRoaXMuaWRUb2tlbiA9IGlkVG9rZW47XG4gICAgICBjb25zb2xlLmxvZyh7IGFjY2Vzc1Rva2VuLCBpZFRva2VuIH0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBnZXRJc0xvZ2dlZEluKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB7IGFjY2Vzc1Rva2VuIH0gPSAoYXdhaXQgZmV0Y2hBdXRoU2Vzc2lvbigpKS50b2tlbnMgPz8ge307XG4gICAgICBpZiAoYWNjZXNzVG9rZW4pIHtcbiAgICAgICAgdGhpcy5pc0xvZ2dlZEluID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgaGFuZGxlU2lnbk91dCgpIHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgc2lnbk91dCgpO1xuICAgICAgdGhpcy5pc0xvZ2dlZEluID0gZmFsc2U7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIG5nT25Jbml0KCkge1xuICAgIGF3YWl0IHRoaXMuZ2V0Q3VycmVudFNlc3Npb24oKTtcbiAgICBhd2FpdCB0aGlzLmdldElzTG9nZ2VkSW4oKTtcbiAgICBjb25zb2xlLmxvZyh0aGlzLmlzTG9nZ2VkSW4pO1xuICB9XG4gIHRpdGxlID0gJ2FuZ3VsYXItYW1wbGlmeS1ob3JzZW1lbic7XG59XG4iLCI8bWF0LXRvb2xiYXI+XG4gIDxoMT5UaGUgVGVuIEhvcnNlbWVuPC9oMT5cbiAgPHNwYW4gY2xhc3M9XCJtZW51LXNwYWNlclwiPjwvc3Bhbj5cbiAgPGJ1dHRvbiBzdHlsZT1cIm1hcmdpbi1yaWdodDogMTBweDtcIiBjbGFzcz1cImJ1dHRvblwiIChjbGljayk9XCJnZXRDdXJyZW50U2Vzc2lvbigpXCI+R2V0IFNlc3Npb248L2J1dHRvbj5cbiAgPG5nLWNvbnRhaW5lciAqbmdJZj1cImlzTG9nZ2VkSW5cIj5cbiAgICA8YSBjbGFzcz1cImJ1dHRvblwiIChjbGljayk9XCJoYW5kbGVTaWduT3V0KClcIj5Mb2dvdXQ8L2E+XG4gIDwvbmctY29udGFpbmVyPlxuICA8bmctY29udGFpbmVyICpuZ0lmPVwiIWlzTG9nZ2VkSW5cIj5cbiAgICA8YSBjbGFzcz1cImJ1dHRvblwiIFtyb3V0ZXJMaW5rXT1cIlsnL2xvZ2luJ11cIiByb3V0ZXJMaW5rQWN0aXZlPVwicm91dGVyLWxpbmstYWN0aXZlXCI+TG9naW48L2E+XG4gIDwvbmctY29udGFpbmVyPlxuPC9tYXQtdG9vbGJhcj5cbjxyb3V0ZXItb3V0bGV0Pjwvcm91dGVyLW91dGxldD4iLCJ7XG4gIFwiYXdzX3Byb2plY3RfcmVnaW9uXCI6IFwidXMtZWFzdC0xXCIsXG4gIFwiYXdzX2FwcHN5bmNfZ3JhcGhxbEVuZHBvaW50XCI6IFwiaHR0cHM6Ly9wNWl1bXFuc3V2ZnI1a2J4ZWJlcHdpNmtsdS5hcHBzeW5jLWFwaS51cy1lYXN0LTEuYW1hem9uYXdzLmNvbS9ncmFwaHFsXCIsXG4gIFwiYXdzX2FwcHN5bmNfcmVnaW9uXCI6IFwidXMtZWFzdC0xXCIsXG4gIFwiYXdzX2FwcHN5bmNfYXV0aGVudGljYXRpb25UeXBlXCI6IFwiQVBJX0tFWVwiLFxuICBcImF3c19hcHBzeW5jX2FwaUtleVwiOiBcImRhMi1jbXptZm5pYnFmZzdubDN1bWJhbGF1YmVkcVwiLFxuICBcImF3c19jb2duaXRvX2lkZW50aXR5X3Bvb2xfaWRcIjogXCJ1cy1lYXN0LTE6MWNhMzMyNTktNzBmNi00ZTE5LWJmMmEtOTVlOGU3YTZiYTlmXCIsXG4gIFwiYXdzX2NvZ25pdG9fcmVnaW9uXCI6IFwidXMtZWFzdC0xXCIsXG4gIFwiYXdzX3VzZXJfcG9vbHNfaWRcIjogXCJ1cy1lYXN0LTFfOTc3aXBoTDdzXCIsXG4gIFwiYXdzX3VzZXJfcG9vbHNfd2ViX2NsaWVudF9pZFwiOiBcIjdmNW9yYTA2YnRnaWo0bzYyNDA0aWtoYTNyXCIsXG4gIFwib2F1dGhcIjoge1xuICAgIFwiZG9tYWluXCI6IFwiYW5ndWxhcmFtcGxpZnlob3JzZW04YWNkNDhmNC04YWNkNDhmNC1kZXYuYXV0aC51cy1lYXN0LTEuYW1hem9uY29nbml0by5jb21cIixcbiAgICBcInNjb3BlXCI6IFtcbiAgICAgIFwicGhvbmVcIixcbiAgICAgIFwiZW1haWxcIixcbiAgICAgIFwib3BlbmlkXCIsXG4gICAgICBcInByb2ZpbGVcIixcbiAgICAgIFwiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW5cIlxuICAgIF0sXG4gICAgXCJyZWRpcmVjdFNpZ25JblwiOiBcImh0dHA6Ly9sb2NhbGhvc3Q6NDIwMC9ob21lL1wiLFxuICAgIFwicmVkaXJlY3RTaWduT3V0XCI6IFwiaHR0cDovL2xvY2FsaG9zdDo0MjAwL2xvZ2luL1wiLFxuICAgIFwicmVzcG9uc2VUeXBlXCI6IFwiY29kZVwiXG4gIH0sXG4gIFwiZmVkZXJhdGlvblRhcmdldFwiOiBcIkNPR05JVE9fVVNFUl9QT09MU1wiLFxuICBcImF3c19jb2duaXRvX3VzZXJuYW1lX2F0dHJpYnV0ZXNcIjogW1xuICAgIFwiRU1BSUxcIlxuICBdLFxuICBcImF3c19jb2duaXRvX3NvY2lhbF9wcm92aWRlcnNcIjogW1xuICAgIFwiR09PR0xFXCJcbiAgXSxcbiAgXCJhd3NfY29nbml0b19zaWdudXBfYXR0cmlidXRlc1wiOiBbXG4gICAgXCJFTUFJTFwiXG4gIF0sXG4gIFwiYXdzX2NvZ25pdG9fbWZhX2NvbmZpZ3VyYXRpb25cIjogXCJPRkZcIixcbiAgXCJhd3NfY29nbml0b19tZmFfdHlwZXNcIjogW1xuICAgIFwiU01TXCJcbiAgXSxcbiAgXCJhd3NfY29nbml0b19wYXNzd29yZF9wcm90ZWN0aW9uX3NldHRpbmdzXCI6IHtcbiAgICBcInBhc3N3b3JkUG9saWN5TWluTGVuZ3RoXCI6IDgsXG4gICAgXCJwYXNzd29yZFBvbGljeUNoYXJhY3RlcnNcIjogW11cbiAgfSxcbiAgXCJhd3NfY29nbml0b192ZXJpZmljYXRpb25fbWVjaGFu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MEJBQTRCLENBQUM7QUFDL0I7QUFDQSwwQ0FBdUM7QUFBQSxFQUNyQztBQUNGO0FBM0NGO0FBQUEsRUFDRTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBYUE7QUFBQSxFQUNBO0FBQUEsRUFHQTtBQUFBLEVBR0E7QUFBQSxFQUdBO0FBQUEsRUFDQTtBQUFBLEVBR0E7QUFBQSxFQUlBO0FBR0Y7OztBYnZDQSxRQUFRLFVBQVUsNEJBQU07QUFFeEIscUJBQXFCLGNBQWMsU0FBUyxFQUN6QyxNQUFNLENBQUMsUUFBUSxRQUFRLE1BQU0sR0FBRyxDQUFDOyIsIm5hbWVzIjpbIkNvbXBvbmVudCIsIkNvbXBvbmVudCIsIkNvbXBvbmVudCIsIkNvbXBvbmVudCIsIkFtcGxpZnlBdXRoZW50aWNhdG9yTW9kdWxlIiwiX2MwIiwiQW1wbGlmeUF1dGhlbnRpY2F0b3JNb2R1bGUiXX0=