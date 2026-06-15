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

    // 1. Visibility check (shoulders, hips, knees must be in frame)
    const MIN_VISIBILITY = 0.55;
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

    // 2. User Centered in Frame (Balanced parameter: 0.38 to 0.62)
    const midHipX = (lHip.x + rHip.x) / 2;
    if (midHipX < 0.38 || midHipX > 0.62) {
      issues.push("Center your body in the frame.");
    }

    // 3. Camera Level (Balanced parameter: 0.07)
    const shoulderTilt = Math.abs(lSh.y - rSh.y);
    const hipTilt = Math.abs(lHip.y - rHip.y);
    if (shoulderTilt > 0.07 || hipTilt > 0.07) {
      issues.push("Keep the camera level (do not tilt).");
    }

    // 4. User Standing Straight (Balanced parameter: 0.09)
    const midShoulderX = (lSh.x + rSh.x) / 2;
    if (Math.abs(midShoulderX - midHipX) > 0.09) {
      issues.push("Stand straight facing the camera.");
    }

    // 5. Arms Position Check (Only enforced if wrists are visible in frame)
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

      if (rSeparation < 0.04 || lSeparation < 0.04) {
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

    const MIN_VISIBILITY = 0.55;
    
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

    // 1. Centered in Frame (Balanced parameter: 0.38 to 0.62)
    if (hip.x < 0.38 || hip.x > 0.62) {
      issues.push("Center your body in the frame.");
    }

    // 2. Profile Overlap / Turned Sideways (Scale-Invariant checks using shoulder-width-to-torso-height ratio)
    const lSh = landmarks[L_SHOULDER];
    const rSh = landmarks[R_SHOULDER];
    const shoulderWidth = Math.abs(lSh.x - rSh.x);
    const torsoHeight = Math.abs(sh.y - hip.y);
    const ratio = shoulderWidth / Math.max(torsoHeight, 0.1);

    // If ratio of shoulder width to torso height is large, they are facing the camera (not turned sideways)
    if (ratio > 0.42) {
      issues.push("Turn fully sideways (90°) to the camera.");
    }

    // 3. Straight Alignment (Balanced parameter: 0.09)
    if (Math.abs(sh.x - hip.x) > 0.09) {
      issues.push("Stand straight with neutral posture.");
    }

    return {
      isValid: issues.length === 0,
      issues: issues.length > 0 ? issues : ["Ready to Capture"],
    };
  }
};
