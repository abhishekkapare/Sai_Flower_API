import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// Configure Cloudinary only when needed
function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Sanitise values that go into Cloudinary context strings (| and = are delimiters)
function sanitizeCtxValue(val: string): string {
  return String(val).replace(/[|=]/g, " ").trim();
}

function buildContextString(data: {
  title?: string;
  description?: string;
  category?: string;
  order?: number | string;
  featured?: boolean | string;
}): string {
  const parts: string[] = [];

  if (data.title !== undefined)
    parts.push(`title=${sanitizeCtxValue(String(data.title))}`);

  if (data.description !== undefined)
    parts.push(`description=${sanitizeCtxValue(String(data.description))}`);

  if (data.category !== undefined)
    parts.push(`category=${sanitizeCtxValue(String(data.category))}`);

  if (data.order !== undefined)
    parts.push(`order=${data.order}`);

  if (data.featured !== undefined)
    parts.push(`featured=${data.featured}`);

  return parts.join("|");
}

function parseResource(r: any) {
  const ctx = r.context?.custom ?? {};

  return {
    id: r.public_id,
    publicId: r.public_id,
    url: r.secure_url,
    title:
      ctx.title ||
      r.display_name ||
      r.public_id.split("/").pop() ||
      "",
    description: ctx.description || "",
    category: ctx.category || (r.tags?.[0] ?? "uncategorized"),
    featured: ctx.featured === "true",
    order: parseInt(ctx.order ?? "9999", 10),
    createdAt: r.created_at,
  };
}

// ===================== GET GALLERY =====================
router.get("/gallery", async (_req, res) => {
  configureCloudinary();

  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "gallery/",
      max_results: 500,
      context: true,
      tags: true,
    });

    const images = (result.resources as any[])
      .map(parseResource)
      .sort((a, b) => a.order - b.order);

    console.info(`[gallery] Listed ${images.length} images`);

    res.json(images);
  } catch (err: any) {
    console.error("[gallery] GET error:", err);

    res.status(500).json({
      error: err.message ?? "Failed to list gallery images.",
    });
  }
});

// ===================== UPDATE METADATA =====================
router.post(
  "/gallery/metadata",
  (req, res, next) => {
    console.log(">>> HIT METADATA ROUTE");
    next();
  },
  requireAuth,
  async (req, res) => {
      configureCloudinary();

  const {
    publicId,
    title,
    description,
    category,
    order,
    featured,
  } = req.body;

  if (!publicId) {
    return res.status(400).json({
      error: "publicId is required.",
    });
  }

  try {
    const contextStr = buildContextString({
      title,
      description,
      category,
      order,
      featured,
    });

    const tags = category ? [category] : undefined;

    await cloudinary.api.update(publicId, {
      context: contextStr,
      ...(tags ? { tags } : {}),
    });

    console.info(`[gallery] Metadata updated: ${publicId}`);

    res.json({
      ok: true,
    });
  } catch (err: any) {
    console.error("[gallery] Metadata error:", err);

    res.status(500).json({
      error: err.message ?? "Failed to update metadata.",
    });
  }
});

// ===================== DELETE IMAGE =====================
router.post("/gallery/delete", requireAuth, async (req, res) => {
  configureCloudinary();

  const { publicId } = req.body;

  if (!publicId) {
    return res.status(400).json({
      error: "publicId is required.",
    });
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "not found") {
      return res.status(404).json({
        error: "Image not found.",
      });
    }

    console.info(`[gallery] Deleted ${publicId}`);

    res.json({
      ok: true,
    });
  } catch (err: any) {
    console.error("[gallery] Delete error:", err);

    res.status(500).json({
      error: err.message ?? "Failed to delete image.",
    });
  }
});

// ===================== REORDER =====================
router.post("/gallery/reorder", requireAuth, async (req, res) => {
  configureCloudinary();

  const items = req.body as Array<{
    publicId: string;
    order: number;
  }>;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: "Invalid request.",
    });
  }

  try {
    await Promise.all(
      items.map(({ publicId, order }) =>
        cloudinary.api.update(publicId, {
          context: `order=${order}`,
        })
      )
    );

    console.info(`[gallery] Reordered ${items.length} images`);

    res.json({
      ok: true,
    });
  } catch (err: any) {
    console.error("[gallery] Reorder error:", err);

    res.status(500).json({
      error: err.message ?? "Failed to reorder images.",
    });
  }
});

export default router;