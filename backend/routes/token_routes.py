"""
Token Management Routes
API endpoints for managing user tokens
"""

from flask import Blueprint, request, jsonify
from services.firebase.firebase_tokens import firebase_service
from services.firebase.firebase_auth import require_auth


# Create the blueprint
token_bp = Blueprint('tokens', __name__, url_prefix='/api/v1/tokens')

@token_bp.route('/balance', methods=['GET'])
@require_auth
def get_token_balance():
    """
    Get the current token balance for the authenticated user
    
    Returns:
        JSON response with token count
    """
    try:
        user_id = request.user['uid']
        token_count = firebase_service.get_user_tokens(user_id)
        
        return jsonify({
            'success': True,
            'tokens': token_count,
            'user_id': user_id
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@token_bp.route('/spend', methods=['POST'])
@require_auth
def spend_tokens():
    """
    Spend tokens for the authenticated user
    
    Request Body:
        amount (int): Number of tokens to spend (default: 1)
        
    Returns:
        JSON response with success status and remaining tokens
    """
    try:
        user_id = request.user['uid']
        data = request.get_json()
        amount = data.get('amount', 1)
        
        # Validate amount
        if not isinstance(amount, int) or amount <= 0:
            return jsonify({
                'success': False,
                'error': 'Invalid token amount. Must be a positive integer.'
            }), 400
        
        # Spend the tokens
        success, remaining_tokens, message = firebase_service.spend_tokens(user_id, amount)
        
        if success:
            return jsonify({
                'success': True,
                'message': message,
                'remaining_tokens': remaining_tokens,
                'amount_spent': amount
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': message,
                'remaining_tokens': remaining_tokens
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@token_bp.route('/add', methods=['POST'])
@require_auth
def add_tokens():
    """
    Add tokens to the authenticated user's account
    (This endpoint should be protected and only accessible by admins in production)
    
    Request Body:
        amount (int): Number of tokens to add
        
    Returns:
        JSON response with new token balance
    """
    try:
        user_id = request.user['uid']
        data = request.get_json()
        amount = data.get('amount')
        
        # Validate amount
        if not amount or not isinstance(amount, int) or amount <= 0:
            return jsonify({
                'success': False,
                'error': 'Invalid token amount. Must be a positive integer.'
            }), 400
        
        # Add the tokens
        new_balance = firebase_service.add_tokens(user_id, amount)
        
        return jsonify({
            'success': True,
            'message': f'Successfully added {amount} tokens',
            'new_balance': new_balance
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@token_bp.route('/initialize', methods=['POST'])
@require_auth
def initialize_user_tokens():
    """
    Initialize tokens for a new user
    This is automatically called when a user first accesses their tokens
    
    Returns:
        JSON response with initialization status
    """
    try:
        user_id = request.user['uid']
        firebase_service.initialize_user_tokens(user_id)
        
        return jsonify({
            'success': True,
            'message': 'User tokens initialized',
            'initial_tokens': 3
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@token_bp.route('/verify-and-spend', methods=['POST'])
@require_auth
def verify_and_spend_tokens():
    """
    Verify user has enough tokens and spend them atomically
    This is the main endpoint to use before performing token-gated actions
    
    Request Body:
        amount (int): Number of tokens to spend (default: 1)
        action (str): Description of what the tokens are being spent on
        
    Returns:
        JSON response with success status and transaction details
    """
    try:
        user_id = request.user['uid']
        data = request.get_json()
        amount = data.get('amount', 1)
        action = data.get('action', 'Service usage')
        
        # Validate amount
        if not isinstance(amount, int) or amount <= 0:
            return jsonify({
                'success': False,
                'error': 'Invalid token amount. Must be a positive integer.'
            }), 400
        
        # Check current balance first
        current_balance = firebase_service.get_user_tokens(user_id)
        
        if current_balance < amount:
            return jsonify({
                'success': False,
                'error': 'Insufficient tokens',
                'current_balance': current_balance,
                'required': amount
            }), 402  # Payment Required
        
        # Spend the tokens
        success, remaining_tokens, message = firebase_service.spend_tokens(user_id, amount)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Tokens spent successfully for: {action}',
                'transaction': {
                    'amount_spent': amount,
                    'remaining_balance': remaining_tokens,
                    'action': action,
                    'user_id': user_id
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': message,
                'current_balance': remaining_tokens
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Error handler for the blueprint
@token_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Token endpoint not found'
    }), 404

@token_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
