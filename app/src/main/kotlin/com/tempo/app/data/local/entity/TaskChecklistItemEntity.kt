package com.tempo.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "task_checklist_items")
data class TaskChecklistItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0L,
    val taskId: Long,
    val label: String,
    val done: Boolean,
    val sortOrder: Int,
)
