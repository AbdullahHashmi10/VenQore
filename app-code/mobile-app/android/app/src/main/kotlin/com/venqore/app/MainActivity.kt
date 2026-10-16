package com.venqore.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // The channel delivery and order alerts arrive on (Android 8+): loud, shown on the lock screen.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "venqore_alerts",
                "Delivery and order alerts",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply { description = "New deliveries, orders and reassignments" }
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }
}
