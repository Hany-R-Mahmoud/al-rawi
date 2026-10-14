package com.hany.alrawi;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * Privacy-first: receive user-initiated ACTION_SEND intents.
 * Explicitly remove the historical notification-listener database on app upgrade.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        deleteDatabase("notifications.db");
        registerPlugin(SharedContentPlugin.class);
        registerPlugin(GoogleSourcesPlugin.class);
        super.onCreate(savedInstanceState);
        SharedContentPlugin.receiveIntent(this, getIntent());
        // Do not re-import the same share if Android recreates this Activity.
        if (getIntent() != null && Intent.ACTION_SEND.equals(getIntent().getAction())) {
            getIntent().setAction(Intent.ACTION_MAIN);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        SharedContentPlugin.receiveIntent(this, intent);
        if (intent != null && Intent.ACTION_SEND.equals(intent.getAction())) {
            intent.setAction(Intent.ACTION_MAIN);
        }
    }
}
