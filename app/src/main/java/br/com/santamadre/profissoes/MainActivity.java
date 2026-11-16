package br.com.santamadre.profissoes;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.InputStream;

public class MainActivity extends Activity {
  private static final int CAMERA_REQUEST = 77;
  private static final String ORIGIN = "https://appassets.androidplatform.net";
  private WebView view;
  private PermissionRequest pending;

  @Override public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    view = new WebView(this);
    setContentView(view);
    WebSettings settings = view.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setMediaPlaybackRequiresUserGesture(false);
    view.setWebChromeClient(new WebChromeClient() {
      @Override public void onPermissionRequest(PermissionRequest request) {
        runOnUiThread(() -> {
          // Grant only the camera resource and only to our packaged internal page.
          boolean videoRequested = false;
          for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) videoRequested = true;
          }
          String origin = request.getOrigin() == null ? "" : request.getOrigin().toString();
          boolean trusted = origin.equals(ORIGIN) || origin.equals(ORIGIN + "/");
          if (!videoRequested || !trusted) {
            request.deny();
            return;
          }
          if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
          } else {
            if (pending != null) pending.deny();
            pending = request;
            requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_REQUEST);
          }
        });
      }
      @Override public void onPermissionRequestCanceled(PermissionRequest request) {
        if (pending == request) pending = null;
      }
    });
    view.setWebViewClient(new WebViewClient() {
      @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest request) {
        Uri url = request.getUrl();
        if (!"https".equals(url.getScheme()) || !"appassets.androidplatform.net".equals(url.getHost()) ||
            !url.getPath().startsWith("/assets/")) return null;
        String path = url.getPath().substring("/assets/".length());
        if (path.contains("..")) return new WebResourceResponse("text/plain", "UTF-8", null);
        if (path.isEmpty()) path = "index.html";
        try {
          InputStream in = getAssets().open("web/" + path);
          String mime = path.endsWith(".html") ? "text/html" :
                        path.endsWith(".js") ? "application/javascript" :
                        path.endsWith(".css") ? "text/css" : "text/plain";
          return new WebResourceResponse(mime, "UTF-8", in);
        } catch (Exception e) {
          return new WebResourceResponse("text/plain", "UTF-8", null);
        }
      }
    });
    open(getIntent());
    // Ask Android for camera permission upfront; WebView needs a second, site-level grant.
    if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      requestPermissions(new String[]{Manifest.permission.CAMERA}, CAMERA_REQUEST);
    }
  }

  private void open(Intent intent) {
    String job = "escritor";
    Uri data = intent == null ? null : intent.getData();
    if (data != null && "santamadre".equals(data.getScheme()) && "profissao".equals(data.getHost())) {
      String queryJob = data.getQueryParameter("job");
      if ("medico".equals(queryJob) || "advogado".equals(queryJob) ||
          "escritor".equals(queryJob) || "empresario".equals(queryJob)) job = queryJob;
    }
    view.loadUrl(ORIGIN + "/assets/photo.html?job=" + job);
  }

  @Override protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    setIntent(intent);
    open(intent);
  }

  @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    if (requestCode == CAMERA_REQUEST) {
      boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
      if (pending != null) {
        if (granted) pending.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        else pending.deny();
        pending = null;
      }
      if (!granted) Toast.makeText(this, "Ative a câmera nas permissões do aplicativo.", Toast.LENGTH_LONG).show();
    }
  }

  @Override protected void onDestroy() {
    if (pending != null) { pending.deny(); pending = null; }
    if (view != null) view.destroy();
    super.onDestroy();
  }
}
