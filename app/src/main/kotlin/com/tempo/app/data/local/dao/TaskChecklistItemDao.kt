package com.tempo.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Update
import com.tempo.app.data.local.entity.TaskChecklistItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskChecklistItemDao {
    @Query("SELECT * FROM task_checklist_items WHERE taskId = :taskId ORDER BY sortOrder ASC")
    fun observeForTask(taskId: Long): Flow<List<TaskChecklistItemEntity>>

    @Query("SELECT * FROM task_checklist_items WHERE taskId = :taskId ORDER BY sortOrder ASC")
    suspend fun getForTask(taskId: Long): List<TaskChecklistItemEntity>

    @Insert
    suspend fun insert(item: TaskChecklistItemEntity): Long

    @Update
    suspend fun update(item: TaskChecklistItemEntity)

    @Delete
    suspend fun delete(item: TaskChecklistItemEntity)

    @Query("DELETE FROM task_checklist_items WHERE id = :id")
    suspend fun deleteById(id: Long)
}
