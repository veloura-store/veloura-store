// Aapne jo nayi keys deni hain, wo yahan ayengi:
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3Z2RkZmh3b2FtcXdocmFvd251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NzM4NzMsImV4cCI6MjA5ODQ0OTg3M30.Y9o3LjTtp2DCGvBLB45i3-s17aMTXM4M8HkYjo9oQfk'; 
const supabaseUrl = 'https://gwgddfhwoamqwhraownu.supabase.co';

// Supabase client initialize karein
// CDN exposes `window.supabase` object jismein `createClient` hota hai
let supabaseClient = null;
try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
        console.log("✅ Supabase client initialized successfully!");
    } else {
        console.warn("⚠️ Supabase CDN not loaded yet — client not initialized.");
    }
} catch (err) {
    console.error("❌ Supabase initialization failed:", err);
}

// Global access ke liye
window.supabaseClient = supabaseClient;
