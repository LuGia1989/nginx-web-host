/*
 * Portal Configuration
 * ====================
 * Edit this file to add, remove, or modify applications.
 * After editing, just refresh the browser -- no Docker rebuild needed
 * (thanks to the volume mount in docker-compose.yml).
 *
 * DNS SETUP:
 * 1. Replace "portal.example.com" below with your actual domain name.
 * 2. Replace each app's "url" with your real DNS name or IP:port.
 *    You can use either:
 *      - DNS names:  "https://chat.example.com"
 *      - IP + port:  "http://192.168.1.100:3000"
 * 3. Update nginx/default.conf server_name to match your portal domain.
 * 4. If using HTTPS, all app URLs must also be HTTPS (no mixed content).
 *
 * IMPORTANT: iframe Compatibility
 * Some apps block being loaded in iframes via X-Frame-Options or
 * Content-Security-Policy headers. If an app refuses to load in the
 * iframe, you may need to configure it to allow embedding:
 *   - Grafana: set allow_embedding = true in grafana.ini
 *   - Open WebUI: check security/embedding settings
 *   - Others: consult the app's documentation
 */

const PORTAL_CONFIG = {
  title: "AI Command Center",
  subtitle: "Intelligent Application Hub",

  portalDomain: "__PORTAL_DOMAIN__",
  portalUrl: "__PORTAL_URL__",

  apps: [
    {
      id: "chat-assistant",
      name: "Stock Agent - Agentic AI",
      icon: "\uD83D\uDCC8",
      url: "__APP1_URL__",
      bgImage: "img/stock.png",
      screenImage: "img/stock-screen.png",
      screenAnim: "float",
      description: "This demo highlights an agentic AI workflow built around four specialized agents that execute in sequence, each applying the most effective approach for its designated role. Together, they form a four-agent stock analysis pipeline powered by Ampere AI models and optimized for CPU-only inference. The entire solution runs locally, requiring no GPU acceleration and no external cloud APIs. It is designed to operate on Ampere Arm64 platforms or Oracle OCI A4 instances, enabling a fully self-hosted AI environment. By combining efficient CPU-based inference with strong performance-per-watt, Ampere processors make this architecture an excellent fit for continuous, always-on deployment scenarios.",
      color: "#00d4ff",
      tags: ["Llama", "Analysis and Decision Making", "Ampere CPU"],
      // version: "v2.1.0"
    },
    {
      id: "model-training",
      name: "AI Model Explorer",
      icon: "\uD83E\uDDE0",
      url: "__APP2_URL__",
      bgImage: "img/ai-models.png",
      screenImage: "img/ai-models-screen.png",
      screenAnim: "scan",
      description: "A fully self-contained web platform designed to showcase AI models optimized for Ampere CPUs. It allows users to select models, configure benchmark runs, stream real-time inference logs with markdown support, and review detailed performance metrics in a single interface. This platform highlights that modern CPU inference can deliver production-ready performance without requiring GPUs. The result is a more cost-effective, power-efficient, and operationally simpler AI infrastructure—removing dependency on expensive accelerator hardware. Its architecture is built for straightforward linear scaling: teams can expand capacity by adding more Ampere instances instead of contending for scarce GPU allocation. In addition, quantized models such as Q4_K_4 and Q8R16 run efficiently on CPUs, maintaining strong performance with minimal impact on output quality.",
      color: "#7c3aed",
      tags: ["Ampere AI Models", "Model Explorer", "Ampere CPU"],
      // version: "v1.8.3"
    },
    {
      id: "data-pipeline",
      name: "YOLOv11 Object Detections & Tracking",
      icon: "\uD83D\uDE97",
      url: "__APP3_URL__",
      bgImage: "img/yolo11.png",
      screenImage: "img/yolo11-screen.png",
      screenAnim: "drive",
      description: "An end-to-end video intelligence platform optimized for Ampere CPUs, integrating YOLO11 for object detection, ByteTrack for object tracking, Llama 3.2 3B for AI inference, RAG-based question answering, and Grafana for system observability. Simply provide a video source, and the platform will detect and track objects in real time while allowing users to ask natural-language questions through an intelligent chatbot powered by an Ampere-optimized Llama model.",
      color: "#10b981",
      tags: ["YOLOv11 and Llama3.2-3B", "Detection & Tracking", "Ampere CPU"],
      // version: "v3.0.1"
    },
    {
      id: "image-generator",
      name: "Fashion Trend Analysis - Multi-Model Multi-Agent",
      icon: "\uD83E\uDDE5",
      url: "__APP4_URL__",
      bgImage: "img/fashion.png",
      screenImage: "img/fashion-screen.png",
      screenAnim: "walk",
      description: "This real-time fashion analytics platform combines YOLO11 (Ultralytics) for person detection and tracking with the Qwen2.5-VL-3B vision-language model for clothing color and style classification. With Llama3.2-3B integrated for RAG-based fashion Q&A, the solution delivers intelligent, interactive fashion insights. The entire multi-model pipeline is optimized for high-performance execution on Ampere processors.",
      color: "#f59e0b",
      tags: ["YOLOv11, Qwen2.5-VL-3B, and Llama3.2-3B", "Image, Classification, and Informative", "Ampere CPU"],
      // version: "v1.5.0"
    }
  ]
};
