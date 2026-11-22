package com.melliapos.mellia_pos_mobile

import android.os.Build
import android.os.Handler
import android.os.Looper
import com.sunmi.peripheral.printer.InnerPrinterCallback
import com.sunmi.peripheral.printer.InnerPrinterManager
import com.sunmi.peripheral.printer.InnerResultCallback
import com.sunmi.peripheral.printer.SunmiPrinterService
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

/**
 * Bridge "mellia/printer": drives the printer built into Sunmi terminals (V2, V2 Pro, T2, D2...)
 * through Sunmi's own printer service, the same way as the Mihos POS app.
 * On any other phone or tablet the service is absent and the app falls back to Bluetooth.
 */
class MainActivity : FlutterActivity() {
    private var printer: SunmiPrinterService? = null
    private val main = Handler(Looper.getMainLooper())

    private val printerLink = object : InnerPrinterCallback() {
        override fun onConnected(service: SunmiPrinterService?) {
            printer = service
        }

        override fun onDisconnected() {
            printer = null
        }
    }

    private val isSunmi: Boolean
        get() = Build.MANUFACTURER.uppercase().contains("SUNMI") || Build.BRAND.uppercase().contains("SUNMI")

    /** Binds Sunmi's printer service; false on a terminal without it. */
    private fun bindPrinter(): Boolean = runCatching {
        InnerPrinterManager.getInstance().bindService(applicationContext, printerLink)
    }.getOrDefault(false)

    /** 1 ready, 2 starting, 3 error, 4 out of paper, 5 overheated, 6 cover open, 7 cutter error, 505 no printer. */
    private fun printerState(): Int = runCatching { printer?.updatePrinterState() ?: -1 }.getOrDefault(-1)

    private fun printerInfo(): Map<String, Any?> {
        val service = printer
        return mapOf(
            "bound" to (service != null),
            "sunmi" to isSunmi,
            "manufacturer" to Build.MANUFACTURER,
            "model" to Build.MODEL,
            "state" to printerState(),
            // 1 = 58 mm, 2 = 80 mm.
            "paper" to runCatching { service?.printerPaper }.getOrNull(),
            "printerModel" to runCatching { service?.printerModal }.getOrNull(),
        )
    }

    /** Sends ESC/POS bytes straight to the printer queue and answers once with the result. */
    private fun printRaw(bytes: ByteArray, result: MethodChannel.Result) {
        val service = printer
            ?: return result.success(mapOf("ok" to false, "code" to -1, "message" to "printer service not bound"))
        val state = printerState()
        if (state in 2..7) {
            return result.success(mapOf("ok" to false, "code" to state, "state" to state, "message" to "printer state $state"))
        }

        var answered = false
        fun answer(ok: Boolean, code: Int, message: String?) {
            main.post {
                if (answered) return@post
                answered = true
                result.success(mapOf("ok" to ok, "code" to code, "message" to message, "state" to printerState()))
            }
        }

        val done = object : InnerResultCallback() {
            override fun onRunResult(isSuccess: Boolean) = answer(isSuccess, if (isSuccess) 0 else -3, null)
            override fun onReturnString(value: String?) {}
            override fun onRaiseException(code: Int, message: String?) = answer(false, code, message)
            override fun onPrintResult(code: Int, message: String?) = answer(code == 0, code, message)
        }

        try {
            service.sendRAWData(bytes, done)
        } catch (error: Throwable) {
            answer(false, -2, error.message)
            return
        }
        // Some Sunmi firmwares never call back for raw data: the job is queued, so treat it as sent.
        main.postDelayed({ answer(true, 0, "no callback") }, 4000)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        bindPrinter()

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "mellia/printer").setMethodCallHandler { call, result ->
            when (call.method) {
                "bind" -> {
                    if (printer != null) return@setMethodCallHandler result.success(printerInfo())
                    if (!bindPrinter()) return@setMethodCallHandler result.success(printerInfo())
                    // The service answers asynchronously: give it a moment.
                    main.postDelayed({ result.success(printerInfo()) }, 1200)
                }
                "info" -> result.success(printerInfo())
                "raw" -> {
                    val bytes = call.argument<ByteArray>("bytes")
                    if (bytes == null) result.error("bytes", "missing bytes", null) else printRaw(bytes, result)
                }
                "drawer" -> {
                    runCatching { printer?.openDrawer(null) }
                    result.success(printer != null)
                }
                else -> result.notImplemented()
            }
        }
    }

    override fun onDestroy() {
        runCatching { InnerPrinterManager.getInstance().unBindService(applicationContext, printerLink) }
        super.onDestroy()
    }
}
