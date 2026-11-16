package br.com.santamadre.profissoes;
import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
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
  private WebView view;
  private PermissionRequest pending;
  private static final String ORIGIN="https://appassets.androidplatform.net";
  @Override public void onCreate(Bundle b) {
    super.onCreate(b);
    view=new WebView(this);
    setContentView(view);
    WebSettings s=view.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    view.setWebChromeClient(new WebChromeClient(){
      @Override public void onPermissionRequest(PermissionRequest r){
        runOnUiThread(()->{
          boolean camera=false;
          for(String resource:r.getResources()) if(PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) camera=true;
          if(!camera || !ORIGIN.equals(r.getOrigin().toString())){r.deny();return;}
          if(Build.VERSION.SDK_INT>=23 && checkSelfPermission(Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED){
            pending=r;
            requestPermissions(new String[]{Manifest.permission.CAMERA},77);
          } else r.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
        });
      }
    });
    view.setWebViewClient(new WebViewClient(){
      @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest req){
        Uri u=req.getUrl();
        if(!"appassets.androidplatform.net".equals(u.getHost()) || !u.getPath().startsWith("/assets/"))return null;
        String p=u.getPath().substring("/assets/".length());
        if(p.contains(".."))return new WebResourceResponse("text/plain","UTF-8",null);
        if(p.isEmpty())p="index.html";
        try{
          InputStream in=getAssets().open("web/"+p);
          String mime=p.endsWith(".html")?"text/html":p.endsWith(".js")?"application/javascript":p.endsWith(".css")?"text/css":"text/plain";
          return new WebResourceResponse(mime,"UTF-8",in);
        }catch(Exception ex){return new WebResourceResponse("text/plain","UTF-8",null);}
      }
    });
    open(getIntent());
  }
  private void open(Intent i){
    String job="escritor";
    Uri u=i==null?null:i.getData();
    if(u!=null && "santamadre".equals(u.getScheme()) && "profissao".equals(u.getHost())){
      String val=u.getQueryParameter("job");
      if("medico".equals(val)||"advogado".equals(val)||"escritor".equals(val)||"empresario".equals(val))job=val;
    }
    view.loadUrl(ORIGIN+"/assets/index.html?job="+job);
  }
  @Override protected void onNewIntent(Intent i){super.onNewIntent(i);setIntent(i);open(i);}
  @Override public void onRequestPermissionsResult(int req,String[] permissions,int[] grants){
    super.onRequestPermissionsResult(req,permissions,grants);
    if(req==77&&pending!=null){
      if(grants.length>0&&grants[0]==PackageManager.PERMISSION_GRANTED)
        pending.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
      else{pending.deny();Toast.makeText(this,"Permita o acesso à câmera",Toast.LENGTH_LONG).show();}
      pending=null;
    }
  }
  @Override protected void onDestroy(){if(view!=null)view.destroy();super.onDestroy();}
}