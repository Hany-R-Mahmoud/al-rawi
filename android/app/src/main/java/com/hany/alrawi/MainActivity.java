package com.hany.alrawi;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NotificationCapturePlugin.class);
        registerPlugin(GoogleSourcesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
