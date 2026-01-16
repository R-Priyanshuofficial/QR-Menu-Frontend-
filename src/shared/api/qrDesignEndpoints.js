// Add to endpoints.js

export const qrDesignAPI = {
  generateDesigns: (designParams) => api.post('/qr/generate-designs', designParams),
}
