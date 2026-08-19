package com.tempo.app.domain.model

data class TaskChecklistItem(
    val id: Long = 0L,
    val taskId: Long,
    val label: String,
    val done: Boolean = false,
    val sortOrder: Int = 0,
)
