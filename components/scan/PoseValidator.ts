export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

export const PoseValidator = {
  validateFrontPose(landmarks: any[]): ValidationResult {
    const issues: string[] = [];
    if (!landmarks || landmarks.length === 0) {
      return { isValid: false, issues: ["No person detected"] };
    }

    // Key landmark indices
    const L_SHOULDER = 11;
    const R_SHOULDER = 12;
    const L_HIP = 23;
    const R_HIP = 24;
    const L_KNEE = 25;
    const R_KNEE = 26;

    // Require shoulders, hips, and knees to be visible
    const keyJoints = [L_SHOULDER, R_SHOULDER, L_HIP, R_HIP, L_KNEE, R_KNEE];

    // 1. Visibility check (shoulders, hips, knees must be in frame) - Relaxed
    const MIN_VISIBILITY = 0.40;
    const missingJoints = keyJoints.filter(idx => {
      const landmark = landmarks[idx];
      return !landmark || (landmark.visibility ?? 0) < MIN_VISIBILITY;
    });

    if (missingJoints.length > 0) {
      issues.push("Step back so your knees and shoulders are in frame.");
      return { isValid: false, issues };
    }

    const lSh = landmarks[L_SHOULDER];
    const rSh = landmarks[R_SHOULDER];
    const lHip = landmarks[L_HIP];
    const rHip = landmarks[R_HIP];

    // 2. User Centered in Frame - Relaxed (Balanced parameter: 0.30 to 0.70)
    const midHipX = (lHip.x + rHip.x) / 2;
    if (midHipX < 0.30 || midHipX > 0.70) {
      issues.push("Center your body in the frame.");
    }

    // 3. Camera Level - Relaxed (Balanced parameter: 0.15)
    const shoulderTilt = Math.abs(lSh.y - rSh.y);
    const hipTilt = Math.abs(lHip.y - rHip.y);
    if (shoulderTilt > 0.15 || hipTilt > 0.15) {
      issues.push("Keep the camera level (do not tilt).");
    }

    // 4. User Standing Straight - Relaxed (Balanced parameter: 0.18)
    const midShoulderX = (lSh.x + rSh.x) / 2;
    if (Math.abs(midShoulderX - midHipX) > 0.18) {
      issues.push("Stand straight facing the camera.");
    }

    // 5. Arms Position Check - Relaxed
    const L_WRIST = 15;
    const R_WRIST = 16;
    const lWrist = landmarks[L_WRIST];
    const rWrist = landmarks[R_WRIST];

    if (
      lWrist && 
      rWrist && 
      (lWrist.visibility ?? 0) > MIN_VISIBILITY && 
      (rWrist.visibility ?? 0) > MIN_VISIBILITY
    ) {
      const rSeparation = rHip.x - rWrist.x;
      const lSeparation = lWrist.x - lHip.x;

      if (rSeparation < 0.02 || lSeparation < 0.02) {
        issues.push("Keep arms slightly away from your sides.");
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : ["Ready to Capture"],
    };
  },

  validateSidePose(landmarks: any[]): ValidationResult {
    const issues: string[] = [];
    if (!landmarks || landmarks.length === 0) {
      return { isValid: false, issues: ["No person detected"] };
    }

    const L_SHOULDER = 11;
    const R_SHOULDER = 12;
    const L_HIP = 23;
    const R_HIP = 24;
    const L_KNEE = 25;
    const R_KNEE = 26;

    const MIN_VISIBILITY = 0.40;
    
    // In side profile, shoulder, hip, and knee on the visible side must be in frame
    const leftSideVisible = 
      (landmarks[L_SHOULDER]?.visibility ?? 0) > MIN_VISIBILITY &&
      (landmarks[L_HIP]?.visibility ?? 0) > MIN_VISIBILITY &&
      (landmarks[L_KNEE]?.visibility ?? 0) > MIN_VISIBILITY;

    const rightSideVisible = 
      (landmarks[R_SHOULDER]?.visibility ?? 0) > MIN_VISIBILITY &&
      (landmarks[R_HIP]?.visibility ?? 0) > MIN_VISIBILITY &&
      (landmarks[R_KNEE]?.visibility ?? 0) > MIN_VISIBILITY;

    if (!leftSideVisible && !rightSideVisible) {
      issues.push("Step back so your profile knee and shoulder are visible.");
      return { isValid: false, issues };
    }

    // Determine active side
    const isLeftSide = leftSideVisible;
    const sh = isLeftSide ? landmarks[L_SHOULDER] : landmarks[R_SHOULDER];
    const hip = isLeftSide ? landmarks[L_HIP] : landmarks[R_HIP];

    // 1. Centered in Frame - Relaxed (Balanced parameter: 0.30 to 0.70)
    if (hip.x < 0.30 || hip.x > 0.70) {
      issues.push("Center your body in the frame.");
    }

    // 2. Profile Overlap / Turned Sideways - Relaxed (Balanced parameter: 0.60)
    const lSh = landmarks[L_SHOULDER];
    const rSh = landmarks[R_SHOULDER];
    const shoulderWidth = Math.abs(lSh.x - rSh.x);
    const torsoHeight = Math.abs(sh.y - hip.y);
    const ratio = shoulderWidth / Math.max(torsoHeight, 0.1);

    if (ratio > 0.60) {
      issues.push("Turn fully sideways (90°) to the camera.");
    }

    // 3. Straight Alignment - Relaxed (Balanced parameter: 0.18)
    if (Math.abs(sh.x - hip.x) > 0.18) {
      issues.push("Stand straight with neutral posture.");
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : ["Ready to Capture"],
    };
  }
};
