// vite.config.js
import { defineConfig } from "file:///C:/xampp/htdocs/capstone2/node_modules/vite/dist/node/index.js";
import react from "file:///C:/xampp/htdocs/capstone2/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  // Ensure correct asset paths when hosted under /capstone2/dist/
  base: "/capstone2/dist/",
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      // Proxy API requests to XAMPP Apache backend (default port 80)
      "/backend/api": {
        target: "http://localhost/capstone2",
        // If Apache uses a different port, e.g., 8080, use 'http://localhost:8080/capstone2'
        changeOrigin: true,
        secure: false
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx4YW1wcFxcXFxodGRvY3NcXFxcY2Fwc3RvbmUyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFx4YW1wcFxcXFxodGRvY3NcXFxcY2Fwc3RvbmUyXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi94YW1wcC9odGRvY3MvY2Fwc3RvbmUyL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIC8vIEVuc3VyZSBjb3JyZWN0IGFzc2V0IHBhdGhzIHdoZW4gaG9zdGVkIHVuZGVyIC9jYXBzdG9uZTIvZGlzdC9cbiAgYmFzZTogJy9jYXBzdG9uZTIvZGlzdC8nLFxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUxNzUsXG4gICAgcHJveHk6IHtcbiAgICAgIC8vIFByb3h5IEFQSSByZXF1ZXN0cyB0byBYQU1QUCBBcGFjaGUgYmFja2VuZCAoZGVmYXVsdCBwb3J0IDgwKVxuICAgICAgJy9iYWNrZW5kL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdC9jYXBzdG9uZTInLCAvLyBJZiBBcGFjaGUgdXNlcyBhIGRpZmZlcmVudCBwb3J0LCBlLmcuLCA4MDgwLCB1c2UgJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MC9jYXBzdG9uZTInXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgIH1cbiAgICB9LFxuICB9XG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVEsU0FBUyxvQkFBb0I7QUFDbFMsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBO0FBQUEsRUFFMUIsTUFBTTtBQUFBLEVBQ04sU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQTtBQUFBLE1BRUwsZ0JBQWdCO0FBQUEsUUFDZCxRQUFRO0FBQUE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
