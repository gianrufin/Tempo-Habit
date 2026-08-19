package com.tempo.app.widget

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback
import com.tempo.app.di.WidgetEntryPoint
import dagger.hilt.android.EntryPointAccessors
import java.time.LocalDate

val habitIdKey = ActionParameters.Key<Long>("habit_id")

class ToggleHabitAction : ActionCallback {
    override suspend fun onAction(context: Context, glanceId: GlanceId, parameters: ActionParameters) {
        val habitId = parameters[habitIdKey] ?: return
        val repository = EntryPointAccessors.fromApplication(
            context.applicationContext,
            WidgetEntryPoint::class.java,
        ).habitRepository()

        repository.cycleCompletion(habitId, LocalDate.now())
        WidgetRefresher.refresh(context)
    }
}
