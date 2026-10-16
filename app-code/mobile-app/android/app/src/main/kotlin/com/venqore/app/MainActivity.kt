package com.venqore.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private var pendingLocation: MethodChannel.Result? = null

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

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // Pages ask for the phone's location; Android needs the app itself to hold the permission.
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "venqore/permissions").setMethodCallHandler { call, result ->
            if (call.method != "requestLocation") {
                result.notImplemented()
                return@setMethodCallHandler
            }
            val fine = Manifest.permission.ACCESS_FINE_LOCATION
            if (ContextCompat.checkSelfPermission(this, fine) == PackageManager.PERMISSION_GRANTED) {
                result.success(true)
            } else if (pendingLocation != null) {
                result.success(false)
            } else {
                pendingLocation = result
                ActivityCompat.requestPermissions(this, arrayOf(fine, Manifest.permission.ACCESS_COARSE_LOCATION), 7731)
            }
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 7731) {
            pendingLocation?.success(grantResults.any { it == PackageManager.PERMISSION_GRANTED })
            pendingLocation = null
        }
    }
}
