<template>
  <div
    :class="[
      'relative overflow-hidden rounded-2xl border border-[#2a2a4a]/60 bg-[#12121a] p-4 md:p-5',
      'transition-all duration-300 ease-out cursor-default',
      'hover:border-[#2a2a4a] hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5',
      'group'
    ]"
  >
    <!-- Glow effect on hover -->
    <div
      :class="[
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl',
      ]"
      :style="{ background: `radial-gradient(ellipse at 50% 0%, ${color}15, transparent 70%)` }"
    ></div>

    <div class="relative flex items-start justify-between">
      <div class="space-y-2">
        <p class="text-xs font-medium text-[#6a6a8a] uppercase tracking-wider">{{ label }}</p>
        <p class="text-lg md:text-2xl font-bold text-[#e8e8f0] tracking-tight">{{ value }}</p>
      </div>
      <div
        :class="[
          'flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300',
          'group-hover:scale-110 group-hover:rotate-3',
        ]"
        :style="{
          backgroundColor: color + '15',
        }"
      >
        <component :is="icon" class="w-5 h-5" :style="{ color }" />
      </div>
    </div>

    <!-- Shimmer effect on hover -->
    <div class="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      :style="{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string
  icon: Component
  color: string
  trend: string | null
}>()
</script>
